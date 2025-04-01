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
                result = decommission_ec2_instance(instance_id)
                return jsonify({"reply": f"Successfully stopped instance {instance_id}: {result}"})
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

# 🟢 Run the Flask App
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
