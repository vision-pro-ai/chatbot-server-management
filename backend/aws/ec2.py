"""EC2 service client"""
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError


# print("i am daizy")
# class EC2Client:
#     def __init__(self, region_name="us-east-1"):
#         self.client = boto3.client('ec2', region_name=region_name)
    
#     def list_instances(self):
#         """List all EC2 instances"""
#         # TODO: Implement instance listing
#         return []
    
#     def start_instance(self, instance_id):
#         """Start an EC2 instance"""
#         # TODO: Implement instance starting
#         return True
    
#     def stop_instance(self, instance_id):
#         """Stop an EC2 instance"""
#         # TODO: Implement instance stopping
#         return True
    
#     def get_instance_status(self, instance_id):
#         """Get the status of an EC2 instance"""
#         # TODO: Implement status checking
#         return "running"
    
    
# Initialize boto3 EC2 client
def get_ec2_instances(region='us-east-1'):
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        response = ec2_client.describe_instances()

        # Process the instances and extract relevant information
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

# Example of how to use the function
if __name__ == "__main__":
    instances = get_ec2_instances()
    if instances:
        for instance in instances:
            print(instance)
            print("instance")
