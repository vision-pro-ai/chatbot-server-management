import re
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class AWSResource:
    id: str
    type: str
    region: Optional[str] = None
    tags: Optional[Dict[str, str]] = None

class EntityExtractor:
    # AWS Resource ID patterns
    PATTERNS = {
        'instance_id': r'i-[a-f0-9]{17}',
        'volume_id': r'vol-[a-f0-9]{17}',
        'snapshot_id': r'snap-[a-f0-9]{8}',
        'ami_id': r'ami-[a-f0-9]{8}',
        'region': r'(us|eu|ap|sa|ca|af|me)-(north|south|east|west|central)-\d',
        'instance_type': r'(t2|t3|m5|c5|r5|g4)\.(nano|micro|small|medium|large|xlarge|2xlarge|4xlarge|8xlarge|16xlarge)',
        'tag_key': r'[a-zA-Z0-9_\-\.]+',
        'tag_value': r'[a-zA-Z0-9_\-\.\s]+'
    }

    def __init__(self):
        self.compiled_patterns = {
            key: re.compile(pattern, re.IGNORECASE)
            for key, pattern in self.PATTERNS.items()
        }

    def extract_entities(self, text: str) -> Dict[str, List[AWSResource]]:
        """
        Extract AWS resource entities from text.
        
        Args:
            text: Input text to extract entities from
            
        Returns:
            Dictionary mapping entity types to lists of AWSResource objects
        """
        entities: Dict[str, List[AWSResource]] = {}
        
        # Extract instance IDs
        instance_ids = self.compiled_patterns['instance_id'].findall(text)
        if instance_ids:
            entities['instances'] = [
                AWSResource(id=instance_id, type='instance')
                for instance_id in instance_ids
            ]
        
        # Extract volume IDs
        volume_ids = self.compiled_patterns['volume_id'].findall(text)
        if volume_ids:
            entities['volumes'] = [
                AWSResource(id=volume_id, type='volume')
                for volume_id in volume_ids
            ]
        
        # Extract snapshot IDs
        snapshot_ids = self.compiled_patterns['snapshot_id'].findall(text)
        if snapshot_ids:
            entities['snapshots'] = [
                AWSResource(id=snapshot_id, type='snapshot')
                for snapshot_id in snapshot_ids
            ]
        
        # Extract AMI IDs
        ami_ids = self.compiled_patterns['ami_id'].findall(text)
        if ami_ids:
            entities['amis'] = [
                AWSResource(id=ami_id, type='ami')
                for ami_id in ami_ids
            ]
        
        # Extract regions
        regions = self.compiled_patterns['region'].findall(text)
        if regions:
            entities['regions'] = [
                AWSResource(id=region, type='region')
                for region in regions
            ]
        
        # Extract instance types
        instance_types = self.compiled_patterns['instance_type'].findall(text)
        if instance_types:
            entities['instance_types'] = [
                AWSResource(id=instance_type, type='instance_type')
                for instance_type in instance_types
            ]
        
        # Extract tags if present
        tag_pattern = rf"({self.PATTERNS['tag_key']})\s*=\s*({self.PATTERNS['tag_value']})"
        tag_matches = re.finditer(tag_pattern, text)
        for match in tag_matches:
            key, value = match.groups()
            if 'tags' not in entities:
                entities['tags'] = []
            entities['tags'].append(
                AWSResource(
                    id=f"{key}={value}",
                    type='tag',
                    tags={key: value}
                )
            )
        
        return entities

    def validate_resource_id(self, resource_id: str, resource_type: str) -> bool:
        """
        Validate if a resource ID matches its expected pattern.
        
        Args:
            resource_id: The resource ID to validate
            resource_type: The type of resource (instance, volume, etc.)
            
        Returns:
            Boolean indicating if the ID is valid
        """
        if resource_type not in self.PATTERNS:
            return False
        
        pattern = self.compiled_patterns[resource_type]
        return bool(pattern.match(resource_id))

def extract_entities(text: str) -> Dict[str, List[AWSResource]]:
    """
    Convenience function to extract entities from text.
    
    Args:
        text: Input text to extract entities from
        
    Returns:
        Dictionary mapping entity types to lists of AWSResource objects
    """
    extractor = EntityExtractor()
    return extractor.extract_entities(text)

# Example usage
if __name__ == "__main__":
    test_inputs = [
        "Start instance i-0a1b2c3d4e5f6g7h8 in ap-south-1",
        "Create a t2.micro instance with tags Environment=Production, Project=WebApp",
        "Backup volume vol-1234567890abcdef to snapshot snap-abcdef12",
        "Launch an instance using AMI ami-12345678",
    ]
    
    extractor = EntityExtractor()
    for test_input in test_inputs:
        print(f"\nInput: {test_input}")
        entities = extractor.extract_entities(test_input)
        for entity_type, resources in entities.items():
            print(f"{entity_type}:")
            for resource in resources:
                print(f"  - {resource.id} ({resource.type})")
                if resource.tags:
                    print(f"    Tags: {resource.tags}")
