from flask import Flask, jsonify, request
from flask_cors import CORS
from aws.monitoring import get_instance_metrics, get_ec2_metrics, get_ebs_metrics, create_cloudwatch_alarm, check_instance_health
from aws.ec2 import get_ec2_instances, tag_ec2_instance, decommission_ec2_instance, enable_detailed_monitoring
from nlp.intent_classifier import classify_intent
from nlp.entity_extractor import extract_entities
import logging
import boto3
from dotenv import load_dotenv
import os
import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS for development
CORS(app, 
     resources={r"/*": {
         "origins": "*",  # Allow all origins in development
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": False
     }})

# Root route
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "success",
        "message": "AWS Server Management API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "ec2_instances": "/ec2/instances",
            "test_aws": "/test-aws",
            "chatbot": "/chatbot",
            "metrics": {
                "ec2": "/metrics/ec2/<instance_id>",
                "ebs": "/metrics/ebs/<volume_id>"
            }
        }
    })

# Error handling
@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"An error occurred: {str(error)}")
    return jsonify({"error": str(error)}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

# EC2 Instance Management
@app.route('/ec2/instances', methods=['GET'])
def list_ec2_instances():
    try:
        instances = get_ec2_instances()
        if instances is None:
            return jsonify({
                "error": "Failed to fetch EC2 instances. Please check AWS credentials and permissions."
            }), 500
        
        return jsonify({
            "instances": instances,
            "message": "Successfully fetched EC2 instances"
        })
    except Exception as e:
        logger.error(f"Error listing EC2 instances: {str(e)}")
        return jsonify({
            "error": f"Failed to fetch EC2 instances: {str(e)}"
        }), 500

# New instance management endpoints
@app.route('/ec2/instances/<instance_id>/start', methods=['POST'])
def start_instance(instance_id):
    try:
        ec2_client = boto3.client('ec2')
        
        # First check the current state of the instance
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        
        if not response['Reservations']:
            return jsonify({
                "error": f"Instance {instance_id} not found"
            }), 404
            
        instance = response['Reservations'][0]['Instances'][0]
        current_state = instance['State']['Name']
        
        # If instance is already running, return appropriate message
        if current_state == 'running':
            return jsonify({
                "message": f"Instance {instance_id} is already running",
                "status": "running"
            })
            
        # If instance is terminated, return appropriate message
        if current_state == 'terminated':
            return jsonify({
                "message": f"Instance {instance_id} is terminated and cannot be started",
                "status": "terminated"
            })
            
        # If instance is in a state that can be started, proceed with starting
        if current_state in ['stopped', 'stopping']:
            response = ec2_client.start_instances(InstanceIds=[instance_id])
            return jsonify({
                "message": f"Successfully started instance {instance_id}",
                "status": "starting"
            })
        else:
            return jsonify({
                "error": f"Cannot start instance {instance_id} from current state: {current_state}",
                "status": current_state
            }), 400
            
    except Exception as e:
        logger.error(f"Error starting instance: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/ec2/instances/<instance_id>/stop', methods=['POST'])
def stop_instance(instance_id):
    try:
        ec2_client = boto3.client('ec2')
        
        # First check the current state of the instance
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        
        if not response['Reservations']:
            return jsonify({
                "error": f"Instance {instance_id} not found"
            }), 404
            
        instance = response['Reservations'][0]['Instances'][0]
        current_state = instance['State']['Name']
        
        # If instance is already terminated, return appropriate message
        if current_state == 'terminated':
            return jsonify({
                "message": f"Instance {instance_id} is already terminated",
                "status": "terminated"
            })
            
        # If instance is already stopped, return appropriate message
        if current_state == 'stopped':
            return jsonify({
                "message": f"Instance {instance_id} is already stopped",
                "status": "stopped"
            })
            
        # If instance is in a state that can be stopped, proceed with stopping
        if current_state in ['running', 'pending']:
            response = ec2_client.stop_instances(InstanceIds=[instance_id])
            return jsonify({
                "message": f"Successfully stopped instance {instance_id}",
                "status": "stopping"
            })
        else:
            return jsonify({
                "error": f"Cannot stop instance {instance_id} from current state: {current_state}",
                "status": current_state
            }), 400
            
    except Exception as e:
        logger.error(f"Error stopping instance: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/ec2/tag', methods=['POST'])
def tag_instance():
    try:
        data = request.json
        instance_id = data.get('instance_id')
        tags = data.get('tags', {})
        
        if not instance_id or not tags:
            return jsonify({"error": "Instance ID and tags are required"}), 400

        result = tag_ec2_instance(instance_id, tags)
        return jsonify({"message": result})
    except Exception as e:
        logger.error(f"Error tagging instance: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/ec2/decommission', methods=['POST'])
def decommission_instance():
    try:
        data = request.json
        instance_id = data.get('instance_id')
        
        if not instance_id:
            return jsonify({"error": "Instance ID is required"}), 400

        result = decommission_ec2_instance(instance_id)
        return jsonify({"message": result})
    except Exception as e:
        logger.error(f"Error decommissioning instance: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Monitoring Endpoints
@app.route('/monitor/metrics', methods=['GET'])
def fetch_metrics():
    try:
        instance_id = request.args.get('instance_id')
        if not instance_id:
            return jsonify({"error": "Instance ID is required"}), 400

        metrics = get_instance_metrics(instance_id)
        return jsonify(metrics)
    except Exception as e:
        logger.error(f"Error fetching metrics: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/monitor/health', methods=['GET'])
def check_health():
    try:
        instance_id = request.args.get('instance_id')
        if not instance_id:
            return jsonify({"error": "Instance ID is required"}), 400

        health_status = check_instance_health(instance_id)
        return jsonify(health_status)
    except Exception as e:
        logger.error(f"Error checking health: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/monitor/alarm', methods=['POST'])
def create_alarm():
    try:
        data = request.json
        instance_id = data.get('instance_id')
        if not instance_id:
            return jsonify({"error": "Instance ID is required"}), 400

        result = create_cloudwatch_alarm(instance_id)
        return jsonify({"message": result})
    except Exception as e:
        logger.error(f"Error creating alarm: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 🟢 Fetch EC2 Metrics
@app.route('/metrics/ec2/<instance_id>', methods=['GET'])
def ec2_metrics(instance_id):
    try:
        metrics = get_ec2_metrics(instance_id)
        return jsonify({"EC2 Metrics": metrics})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🟢 Fetch EBS Metrics
@app.route('/metrics/ebs/<volume_id>', methods=['GET'])
def ebs_metrics(volume_id):
    try:
        metrics = get_ebs_metrics(volume_id)
        return jsonify({"EBS Metrics": metrics})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🟢 Fetch EC2 Overview (new route for `/ec2`)
@app.route('/ec2', methods=['GET'])
def ec2_overview():
    try:
        # Assuming you have a function for an EC2 overview
        overview = get_ec2_overview()  # Define this function in your aws.monitoring module
        return jsonify({"ec2_overview": overview})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🆕 Chatbot Route with NLP Processing
@app.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"error": "No message provided"}), 400

        user_input = data["message"]
        logger.info(f"Received user input: {user_input}")

        # Classify intent
        intent, confidence = classify_intent(user_input)
        logger.info(f"Classified intent: {intent} (confidence: {confidence})")

        # Extract entities
        entities = extract_entities(user_input)
        logger.info(f"Extracted entities: {entities}")

        # Handle different intents
        if intent == "get_metrics":
            if not entities.get("instances"):
                return jsonify({
                    "reply": "Please provide an instance ID (e.g., i-1234567890abcdef0) to get metrics."
                })
            
            instance_id = entities["instances"][0].id
            try:
                metrics = get_instance_metrics(instance_id)
                return jsonify({
                    "reply": f"Metrics for instance {instance_id}:\n" + 
                            f"CPU Utilization: {metrics.get('cpu_utilization', 'N/A')}%\n" +
                            f"Memory Usage: {metrics.get('memory_usage', 'N/A')}%\n" +
                            f"Network In: {metrics.get('network_in', 'N/A')} bytes\n" +
                            f"Network Out: {metrics.get('network_out', 'N/A')} bytes"
                })
            except Exception as e:
                logger.error(f"Error fetching metrics: {str(e)}")
                return jsonify({
                    "reply": f"Failed to fetch metrics for instance {instance_id}. Error: {str(e)}"
                })

        elif intent == "list_instances":
            instances = get_ec2_instances()
            if not instances:
                return jsonify({"reply": "No EC2 instances found."})
            
            instance_list = "\n".join([
                f"- {instance['Instance ID']} ({instance['State']})"
                for instance in instances
            ])
            return jsonify({"reply": f"Found {len(instances)} instances:\n{instance_list}"})

        elif intent == "stop_instance":
            if not entities.get("instances"):
                return jsonify({
                    "reply": "Please provide an instance ID (e.g., i-1234567890abcdef0) to stop."
                })
            
            instance_id = entities["instances"][0].id
            try:
                # Use the stop_instance endpoint directly
                response = stop_instance(instance_id)
                return jsonify({
                    "reply": response.get_json()["message"]
                })
            except Exception as e:
                logger.error(f"Error stopping instance: {str(e)}")
                return jsonify({
                    "reply": f"Failed to stop instance {instance_id}. Error: {str(e)}"
                })

        elif intent == "start_instance":
            if not entities.get("instances"):
                return jsonify({
                    "reply": "Please provide an instance ID (e.g., i-1234567890abcdef0) to start."
                })
            
            instance_id = entities["instances"][0].id
            try:
                ec2_client = boto3.client('ec2')
                ec2_client.start_instances(InstanceIds=[instance_id])
                return jsonify({"reply": f"Successfully started instance {instance_id}"})
            except Exception as e:
                logger.error(f"Error starting instance: {str(e)}")
                return jsonify({
                    "reply": f"Failed to start instance {instance_id}. Error: {str(e)}"
                })

        elif intent == "tag_instance":
            if not entities.get("instances") or not entities.get("tags"):
                return jsonify({
                    "reply": "Please provide an instance ID and tags (e.g., 'tag instance i-1234567890abcdef0 with environment=production')"
                })
            
            instance_id = entities["instances"][0].id
            tags = {tag.id: tag.type for tag in entities["tags"]}
            try:
                result = tag_ec2_instance(instance_id, tags)
                return jsonify({"reply": f"Successfully tagged instance {instance_id}: {result}"})
            except Exception as e:
                logger.error(f"Error tagging instance: {str(e)}")
                return jsonify({
                    "reply": f"Failed to tag instance {instance_id}. Error: {str(e)}"
                })

        elif intent == "get_instance_details":
            if not entities.get("instances"):
                return jsonify({
                    "reply": "Please provide an instance ID (e.g., i-1234567890abcdef0) to get details."
                })
            
            instance_id = entities["instances"][0].id
            try:
                ec2_client = boto3.client('ec2')
                cloudwatch = boto3.client('cloudwatch')
                
                # Get basic instance details
                response = ec2_client.describe_instances(InstanceIds=[instance_id])
                
                if not response['Reservations']:
                    return jsonify({
                        "error": f"Instance {instance_id} not found"
                    }), 404
                    
                instance = response['Reservations'][0]['Instances'][0]
                
                # Get metrics
                metrics_response = cloudwatch.get_metric_statistics(
                    Namespace='AWS/EC2',
                    MetricName='CPUUtilization',
                    Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                    StartTime=datetime.datetime.now() - datetime.timedelta(hours=24),
                    EndTime=datetime.datetime.now(),
                    Period=3600,
                    Statistics=['Average']
                )
                
                # Get alarms
                alarms_response = cloudwatch.describe_alarms(
                    AlarmNamePrefix=f"Instance-{instance_id}-"
                )
                
                # Get system logs (last 24 hours)
                logs_client = boto3.client('logs')
                log_groups = logs_client.describe_log_groups(
                    logGroupNamePrefix=f"/aws/ec2/{instance_id}"
                )
                
                # Extract relevant details
                details = {
                    "Basic Information": {
                        "Instance ID": instance['InstanceId'],
                        "State": instance['State']['Name'],
                        "Instance Type": instance['InstanceType'],
                        "Launch Time": instance['LaunchTime'].strftime('%Y-%m-%d %H:%M:%S'),
                        "Public IP": instance.get('PublicIpAddress', 'N/A'),
                        "Private IP": instance.get('PrivateIpAddress', 'N/A'),
                        "VPC ID": instance.get('VpcId', 'N/A'),
                        "Subnet ID": instance.get('SubnetId', 'N/A'),
                        "Security Groups": [sg['GroupName'] for sg in instance.get('SecurityGroups', [])],
                        "Tags": {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                    },
                    "Metrics": {
                        "CPU Utilization": f"{metrics_response['Datapoints'][-1]['Average']:.2f}%" if metrics_response['Datapoints'] else "N/A",
                        "Network In": "N/A",  # Add actual network metrics
                        "Network Out": "N/A",  # Add actual network metrics
                        "Disk Usage": "N/A"    # Add actual disk metrics
                    },
                    "Alarms": [
                        {
                            "Name": alarm['AlarmName'],
                            "State": alarm['StateValue'],
                            "Metric": alarm['MetricName'],
                            "Threshold": alarm['Threshold']
                        } for alarm in alarms_response['MetricAlarms']
                    ],
                    "System Logs": {
                        "Last Boot": "N/A",  # Add actual boot time
                        "Last Shutdown": "N/A",  # Add actual shutdown time
                        "Recent Events": []  # Add actual system events
                    }
                }
                
                return jsonify({
                    "instance_id": instance_id,
                    "details": details,
                    "message": f"Details for instance {instance_id}"
                })
            except Exception as e:
                logger.error(f"Error getting instance details: {str(e)}")
                return jsonify({
                    "reply": f"Failed to get details for instance {instance_id}. Error: {str(e)}"
                })

        elif intent == "help":
            help_text = "Available commands:\n"
            for intent_name, description in get_intent_help().items():
                help_text += f"- {description}\n"
            return jsonify({"reply": help_text})

        else:
            return jsonify({
                "reply": "I'm not sure how to help with that. Try asking for:\n" +
                        "- List of instances\n" +
                        "- Start/Stop a specific instance\n" +
                        "- Metrics for a specific instance\n" +
                        "- Tag an instance\n" +
                        "- Get instance details\n" +
                        "- Help with available commands"
            })

    except Exception as e:
        logger.error(f"Error in chatbot: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Test AWS credentials
@app.route('/test-aws', methods=['GET'])
def test_aws():
    try:
        # Try to create an EC2 client
        ec2_client = boto3.client('ec2')
        # Try to list regions to verify credentials
        regions = ec2_client.describe_regions()
        return jsonify({
            "status": "success",
            "message": "AWS credentials are valid",
            "regions": [region['RegionName'] for region in regions['Regions']]
        })
    except Exception as e:
        logger.error(f"AWS credentials test failed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"AWS credentials are invalid: {str(e)}"
        }), 500

@app.route('/ec2/instances/<instance_id>/state', methods=['GET'])
def get_instance_state(instance_id):
    try:
        ec2_client = boto3.client('ec2')
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        
        if not response['Reservations']:
            return jsonify({
                "error": f"Instance {instance_id} not found"
            }), 404
            
        instance = response['Reservations'][0]['Instances'][0]
        state = instance['State']['Name']
        
        return jsonify({
            "instance_id": instance_id,
            "state": state,
            "message": f"Instance {instance_id} is {state}"
        })
    except Exception as e:
        logger.error(f"Error checking instance state: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/ec2/instances/<instance_id>/details', methods=['GET'])
def get_instance_details(instance_id):
    try:
        ec2_client = boto3.client('ec2')
        cloudwatch = boto3.client('cloudwatch')
        
        # Get basic instance details
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        
        if not response['Reservations']:
            return jsonify({
                "error": f"Instance {instance_id} not found"
            }), 404
            
        instance = response['Reservations'][0]['Instances'][0]
        
        # Get metrics
        metrics_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=datetime.datetime.now() - datetime.timedelta(hours=24),
            EndTime=datetime.datetime.now(),
            Period=3600,
            Statistics=['Average']
        )
        
        # Get alarms
        alarms_response = cloudwatch.describe_alarms(
            AlarmNamePrefix=f"Instance-{instance_id}-"
        )
        
        # Get system logs (last 24 hours)
        logs_client = boto3.client('logs')
        log_groups = logs_client.describe_log_groups(
            logGroupNamePrefix=f"/aws/ec2/{instance_id}"
        )
        
        # Extract relevant details
        details = {
            "Basic Information": {
                "Instance ID": instance['InstanceId'],
                "State": instance['State']['Name'],
                "Instance Type": instance['InstanceType'],
                "Launch Time": instance['LaunchTime'].strftime('%Y-%m-%d %H:%M:%S'),
                "Public IP": instance.get('PublicIpAddress', 'N/A'),
                "Private IP": instance.get('PrivateIpAddress', 'N/A'),
                "VPC ID": instance.get('VpcId', 'N/A'),
                "Subnet ID": instance.get('SubnetId', 'N/A'),
                "Security Groups": [sg['GroupName'] for sg in instance.get('SecurityGroups', [])],
                "Tags": {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
            },
            "Metrics": {
                "CPU Utilization": f"{metrics_response['Datapoints'][-1]['Average']:.2f}%" if metrics_response['Datapoints'] else "N/A",
                "Network In": "N/A",  # Add actual network metrics
                "Network Out": "N/A",  # Add actual network metrics
                "Disk Usage": "N/A"    # Add actual disk metrics
            },
            "Alarms": [
                {
                    "Name": alarm['AlarmName'],
                    "State": alarm['StateValue'],
                    "Metric": alarm['MetricName'],
                    "Threshold": alarm['Threshold']
                } for alarm in alarms_response['MetricAlarms']
            ],
            "System Logs": {
                "Last Boot": "N/A",  # Add actual boot time
                "Last Shutdown": "N/A",  # Add actual shutdown time
                "Recent Events": []  # Add actual system events
            }
        }
        
        return jsonify({
            "instance_id": instance_id,
            "details": details,
            "message": f"Details for instance {instance_id}"
        })
    except Exception as e:
        logger.error(f"Error getting instance details: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/ec2/instances/<instance_id>/logs', methods=['GET'])
def get_instance_logs(instance_id):
    try:
        logs_client = boto3.client('logs')
        cloudwatch = boto3.client('cloudwatch')
        
        # Get system logs
        log_groups = logs_client.describe_log_groups(
            logGroupNamePrefix=f"/aws/ec2/{instance_id}"
        )
        
        logs = []
        for log_group in log_groups.get('logGroups', []):
            log_streams = logs_client.describe_log_streams(
                logGroupName=log_group['logGroupName'],
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )
            
            for stream in log_streams.get('logStreams', []):
                events = logs_client.get_log_events(
                    logGroupName=log_group['logGroupName'],
                    logStreamName=stream['logStreamName'],
                    limit=10
                )
                
                for event in events.get('events', []):
                    logs.append({
                        'timestamp': datetime.datetime.fromtimestamp(event['timestamp']/1000).strftime('%Y-%m-%d %H:%M:%S'),
                        'message': event['message'],
                        'log_group': log_group['logGroupName'],
                        'log_stream': stream['logStreamName']
                    })
        
        # Get CloudWatch metrics for system status
        metrics = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='StatusCheckFailed_System',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=datetime.datetime.now() - datetime.timedelta(hours=24),
            EndTime=datetime.datetime.now(),
            Period=3600,
            Statistics=['Sum']
        )
        
        # Get instance state changes
        ec2_client = boto3.client('ec2')
        state_changes = ec2_client.describe_instance_status(
            InstanceIds=[instance_id],
            IncludeAllInstances=True
        )
        
        return jsonify({
            "instance_id": instance_id,
            "logs": logs,
            "metrics": metrics.get('Datapoints', []),
            "state_changes": state_changes.get('InstanceStatuses', []),
            "message": f"Logs for instance {instance_id}"
        })
    except Exception as e:
        logger.error(f"Error getting instance logs: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 🟢 Run the Flask App
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
