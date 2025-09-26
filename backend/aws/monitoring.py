import boto3
import schedule
import time
import datetime
import logging

logger = logging.getLogger(__name__)

def create_cloudwatch_alarm(instance_id, region='ap-south-1'):
    try:
        cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        response = cloudwatch_client.put_metric_alarm(
            AlarmName=f'HighCPUUsage-{instance_id}',
            MetricName='CPUUtilization',
            Namespace='AWS/EC2',
            Statistic='Average',
            Period=300,  # 5 minutes
            EvaluationPeriods=2,
            Threshold=50.0,  # Trigger if CPU > 50%
            ComparisonOperator='GreaterThanThreshold',
            AlarmActions=[],  # Add SNS topic ARN if notifications are needed
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}]
        )
        return f"CloudWatch Alarm for {instance_id} created successfully."
    except Exception as e:
        return f"Error creating CloudWatch alarm: {str(e)}"
    
def put_custom_metric(instance_id, metric_name, value, unit="Count", region="ap-south-1"):
    try:
        cloudwatch = boto3.client('cloudwatch', region_name=region)
        cloudwatch.put_metric_data(
            Namespace='ServerManagementChatbot',
            MetricData=[{
                'MetricName': metric_name,
                'Dimensions': [{'Name': 'InstanceId', 'Value': instance_id}],
                'Value': value,
                'Unit': unit
            }]
        )
        return f"Custom metric {metric_name} updated for instance {instance_id}."
    except Exception as e:
        return f"Error updating metric: {str(e)}"
    
def get_instance_metrics(instance_id, region='ap-south-1'):
    try:
        cloudwatch = boto3.client('cloudwatch', region_name=region)
        
        # Get metrics for the last 24 hours to ensure we have data
        end_time = datetime.datetime.now()
        start_time = end_time - datetime.timedelta(hours=24)
        
        # Get CPU Utilization with proper statistics
        cpu_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,  # 1 hour period
            Statistics=['Average']
        )
        
        # Get Network metrics
        network_in_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='NetworkIn',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        network_out_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='NetworkOut',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        # Process CPU metrics
        cpu_utilization = "N/A"
        if cpu_response.get('Datapoints'):
            # Get the most recent data point
            latest_cpu = sorted(cpu_response['Datapoints'], key=lambda x: x['Timestamp'])[-1]
            cpu_utilization = f"{latest_cpu['Average']:.2f}%"
        
        # Process Network metrics
        network_in = "N/A"
        if network_in_response.get('Datapoints'):
            latest_network_in = sorted(network_in_response['Datapoints'], key=lambda x: x['Timestamp'])[-1]
            network_in = f"{latest_network_in['Sum']:.0f} bytes"
        
        network_out = "N/A"
        if network_out_response.get('Datapoints'):
            latest_network_out = sorted(network_out_response['Datapoints'], key=lambda x: x['Timestamp'])[-1]
            network_out = f"{latest_network_out['Sum']:.0f} bytes"
        
        result = {
            'cpu_utilization': cpu_utilization,
            'network_in': network_in,
            'network_out': network_out,
            'timestamp': end_time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return result
    except Exception as e:
        logger.error(f"Error fetching metrics for instance {instance_id}: {str(e)}")
        return {
            'error': str(e),
            'cpu_utilization': 'N/A',
            'network_in': 'N/A',
            'network_out': 'N/A'
        }

def create_alarm(instance_id, metric_name, threshold, region='ap-south-1'):
    try:
        cloudwatch = boto3.client('cloudwatch', region_name=region)
        alarm_name = f"Alarm-{instance_id}-{metric_name}"
        cloudwatch.put_metric_alarm(
            AlarmName=alarm_name,
            MetricName=metric_name,
            Namespace="ServerManagementChatbot",
            Statistic="Average",
            Period=60,
            EvaluationPeriods=1,
            Threshold=threshold,
            ComparisonOperator="GreaterThanThreshold",
            AlarmActions=[],  # Add SNS topic ARN for notifications
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}]
        )
        return f"Alarm {alarm_name} created."
    except Exception as e:
        return f"Error creating alarm: {str(e)}"
    
def check_instance_health(instance_id, region='ap-south-1'):
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        response = ec2_client.describe_instance_status(InstanceIds=[instance_id])

        if response['InstanceStatuses']:
            status = response['InstanceStatuses'][0]
            return {
                "Instance ID": instance_id,
                "State": status["InstanceState"]["Name"],
                "System Status": status["SystemStatus"]["Status"],
                "Instance Status": status["InstanceStatus"]["Status"]
            }
        return {"error": "Instance not found or not running"}
    except Exception as e:
        return {"error": str(e)}

def get_ec2_metrics(instance_id, region='ap-south-1'):
    cloudwatch = boto3.client('cloudwatch', region_name=region)
    response = cloudwatch.list_metrics(
        Namespace='AWS/EC2',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}]
    )
    return [metric['MetricName'] for metric in response.get('Metrics', [])]

def get_ebs_metrics(volume_id, region='ap-south-1'):
    cloudwatch = boto3.client('cloudwatch', region_name=region)
    response = cloudwatch.list_metrics(
        Namespace='AWS/EBS',
        Dimensions=[{'Name': 'VolumeId', 'Value': volume_id}]
    )
    return [metric['MetricName'] for metric in response.get('Metrics', [])]

def upload_log_to_s3(log_content, filename):
    s3 = boto3.client('s3')
    s3.put_object(Bucket="server-management-logs", Key=filename, Body=log_content)

def scheduled_health_check(instance_id):
    """Scheduled function to check instance health."""
    print(f"[{datetime.datetime.now()}] Running scheduled health check for {instance_id}...")
    health_status = check_instance_health(instance_id)
    print(health_status)

# This function should be called dynamically or passed via a Flask request
def schedule_health_check(instance_id):
    schedule.every(1).minutes.do(lambda: scheduled_health_check(instance_id))
    print(f"Scheduled health check every 1 minute for {instance_id}.")

# Running the scheduled job in the background without input prompts
def run_scheduled_jobs(instance_id):
    schedule_health_check(instance_id)
    while True:
        print(f"[{datetime.datetime.now()}] Checking pending tasks...")
        schedule.run_pending()
        time.sleep(1)

# Example Usage: You can pass the instance_id dynamically (e.g., through an API call)
if __name__ == "__main__":
    # Example of dynamically passing the instance ID
    instance_id = "i-096babbf35ed569d9"  # Replace with dynamic instance ID from Flask or other input source
    run_scheduled_jobs(instance_id)
