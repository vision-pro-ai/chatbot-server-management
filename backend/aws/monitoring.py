import boto3

def create_cloudwatch_alarm(instance_id, region='us-east-1'):
    """
    Creates a CloudWatch alarm for an EC2 instance to monitor CPU utilization.
    
    :param instance_id: EC2 instance ID
    :param region: AWS region
    :return: Success or failure message
    """
    try:
        cloudwatch_client = boto3.client('cloudwatch', region_name=region)

        response = cloudwatch_client.put_metric_alarm(
            AlarmName=f'HighCPUUsage-{instance_id}',
            MetricName='CPUUtilization',
            Namespace='AWS/EC2',
            Statistic='Average',
            Period=300,  # 5 minutes
            EvaluationPeriods=2,
            Threshold=50.0,  # Trigger if CPU > 80%
            ComparisonOperator='GreaterThanThreshold',
            AlarmActions=[],  # Add SNS topic ARN if notifications are needed
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}]
        )

        return f"CloudWatch Alarm for {instance_id} created successfully."

    except Exception as e:
        return f"Error creating CloudWatch alarm: {str(e)}"

# Example Usage
if __name__ == "__main__":
     instance_id = input("Enter the EC2 Instance ID: ").strip()


     print(create_cloudwatch_alarm(instance_id))
