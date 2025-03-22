"""EC2 service client"""
import boto3

print("i am daizy")
class EC2Client:
    def __init__(self, region_name="us-east-1"):
        self.client = boto3.client('ec2', region_name=region_name)
    
    def list_instances(self):
        """List all EC2 instances"""
        # TODO: Implement instance listing
        return []
    
    def start_instance(self, instance_id):
        """Start an EC2 instance"""
        # TODO: Implement instance starting
        return True
    
    def stop_instance(self, instance_id):
        """Stop an EC2 instance"""
        # TODO: Implement instance stopping
        return True
    
    def get_instance_status(self, instance_id):
        """Get the status of an EC2 instance"""
        # TODO: Implement status checking
        return "running"