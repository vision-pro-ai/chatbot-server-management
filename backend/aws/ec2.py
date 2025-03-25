"""EC2 service client"""
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError

def get_ec2_instances(region='us-east-1'):
    """Fetch list of EC2 instances."""
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        response = ec2_client.describe_instances()

        instances = []
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instance_details = {
                    'Instance ID': instance.get('InstanceId'),
                    'Instance Type': instance.get('InstanceType'),
                    'State': instance['State']['Name'],
                    'Launch Time': instance.get('LaunchTime').strftime('%Y-%m-%d %H:%M:%S'),
                    'Public IP': instance.get('PublicIpAddress', 'N/A'),
                }
                instances.append(instance_details)

        return instances

    except (NoCredentialsError, PartialCredentialsError) as e:
        print(f"Error: AWS credentials missing or incomplete. {str(e)}")
        return None
    except Exception as e:
        print(f"Error retrieving EC2 instances: {str(e)}")
        return None

def tag_ec2_instance(instance_id, tags, region='us-east-1'):
    """Tag an EC2 instance."""
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        formatted_tags = [{'Key': k, 'Value': v} for k, v in tags.items()]

        ec2_client.create_tags(Resources=[instance_id], Tags=formatted_tags)
        return f"Tags successfully added to instance {instance_id}: {tags}"

    except Exception as e:
        return f"Error tagging instance {instance_id}: {str(e)}"

def decommission_ec2_instance(instance_id, region='us-east-1'):
    """
    Decommissions an EC2 instance by stopping and terminating it.
    :param instance_id: EC2 instance ID
    :param region: AWS region
    :return: Success or failure message
    """
    try:
        ec2_client = boto3.client('ec2', region_name=region)

        # Stop instance
        ec2_client.stop_instances(InstanceIds=[instance_id])
        print(f"Instance {instance_id} is stopping...")

        # Wait for the instance to stop
        waiter = ec2_client.get_waiter('instance_stopped')
        waiter.wait(InstanceIds=[instance_id])

        # Terminate instance
        ec2_client.terminate_instances(InstanceIds=[instance_id])
        return f"Instance {instance_id} has been successfully terminated."

    except Exception as e:
        return f"Error decommissioning instance {instance_id}: {str(e)}"

def enable_detailed_monitoring(instance_id, region='us-east-1'):
    """Enable detailed monitoring for an EC2 instance."""
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        ec2_client.monitor_instances(InstanceIds=[instance_id])
        return f"Enabled detailed monitoring for instance {instance_id}."
    except Exception as e:
        return f"Error enabling monitoring: {str(e)}"


if __name__ == "__main__":
    # Fetch and display EC2 instances
    instances = get_ec2_instances()
    if instances:
        for instance in instances:
            print(instance)

    # Get instance ID from user
    """instance_id = input("Enter the EC2 Instance ID to tag: ").strip()

    # Get user input for tags (comma-separated key=value pairs)
    tag_input = input("Enter tags (key=value, separated by commas): ").strip()

    # Convert input string into a dictionary
    tags = dict(item.split("=") for item in tag_input.split(",") if "=" in item)

    # Call the tagging function
     print(tag_ec2_instance(instance_id, tags))

        # Get instance ID for decommissioning
        instance_id = input("Enter the EC2 Instance ID to decommission: ").strip()
        print(decommission_ec2_instance(instance_id))
        """
    # Enable detailed monitoring
    instance_id = input("Enter the EC2 Instance ID to enable detailed monitoring: ").strip()
    print(enable_detailed_monitoring(instance_id))
