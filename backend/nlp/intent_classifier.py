import re
from typing import Dict, List, Tuple

# Define intent patterns with confidence scores
INTENT_PATTERNS: Dict[str, List[Tuple[str, float]]] = {
    "start_instance": [
        (r"\b(start|launch|boot|run)\b.*\b(instance|server|vm)\b", 0.9),
        (r"\b(bring up|power on)\b.*\b(instance|server)\b", 0.8),
        (r"\b(create|provision)\b.*\b(new\s+)?(instance|server)\b", 0.7),
    ],
    "stop_instance": [
        (r"\b(stop|shutdown|terminate|kill)\b.*\b(instance|server|vm)\b", 0.9),
        (r"\b(power off|turn off)\b.*\b(instance|server)\b", 0.8),
        (r"\b(delete|remove)\b.*\b(instance|server)\b", 0.7),
    ],
    "reboot_instance": [
        (r"\b(reboot|restart|bounce)\b.*\b(instance|server|vm)\b", 0.9),
        (r"\b(cycle|recycle)\b.*\b(instance|server)\b", 0.8),
    ],
    "get_metrics": [
        (r"\b(check|fetch|get|monitor|show)\b.*\b(metrics|performance|usage|stats)\b", 0.9),
        (r"\b(how is|what is)\b.*\b(performance|status|health)\b", 0.8),
        (r"\b(display|view)\b.*\b(metrics|stats)\b", 0.7),
    ],
    "tag_instance": [
        (r"\b(tag|label|name|mark)\b.*\b(instance|server)\b", 0.9),
        (r"\b(add|set)\b.*\b(tags|labels)\b.*\b(to|for)\b.*\b(instance|server)\b", 0.8),
    ],
    "decommission_instance": [
        (r"\b(decommission|remove|destroy|delete)\b.*\b(instance|server)\b", 0.9),
        (r"\b(clean up|cleanup)\b.*\b(instance|server)\b", 0.8),
    ],
    "list_instances": [
        (r"\b(list|show|display)\b.*\b(instances|servers)\b", 0.9),
        (r"\b(what|which)\b.*\b(instances|servers)\b.*\b(running|active)\b", 0.8),
    ],
    "help": [
        (r"\b(help|assist|support)\b", 0.9),
        (r"\b(what can|how can)\b.*\b(you do|help)\b", 0.8),
    ],
}

def classify_intent(user_input: str) -> Tuple[str, float]:
    """
    Classify user input into a predefined intent with confidence score.
    
    Args:
        user_input: The user's input text
        
    Returns:
        Tuple of (intent, confidence_score)
    """
    user_input = user_input.lower().strip()
    
    best_intent = "unknown"
    best_confidence = 0.0
    
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern, confidence in patterns:
            if re.search(pattern, user_input):
                if confidence > best_confidence:
                    best_intent = intent
                    best_confidence = confidence
    
    return best_intent, best_confidence

def get_intent_help() -> Dict[str, str]:
    """Get help text for each supported intent."""
    return {
        "start_instance": "Start an EC2 instance",
        "stop_instance": "Stop an EC2 instance",
        "reboot_instance": "Reboot an EC2 instance",
        "get_metrics": "Get metrics for an instance",
        "tag_instance": "Add tags to an instance",
        "decommission_instance": "Decommission an instance",
        "list_instances": "List all EC2 instances",
        "help": "Get help about available commands",
    }

# Example usage
if __name__ == "__main__":
    test_inputs = [
        "Can you start my server?",
        "What's the performance of instance i-123456?",
        "Help me with the available commands",
        "List all running instances",
    ]
    
    for test_input in test_inputs:
        intent, confidence = classify_intent(test_input)
        print(f"Input: {test_input}")
        print(f"Intent: {intent} (confidence: {confidence:.2f})")
        print("---")


