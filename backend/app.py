from flask import Flask, jsonify, request
from flask_cors import CORS
from aws.monitoring import get_instance_metrics, get_ec2_metrics, get_ebs_metrics

app = Flask(__name__)
CORS(app)  # Allow frontend requests

@app.route('/monitor/metrics', methods=['GET'])
def fetch_metrics():
    instance_id = request.args.get('instance_id')
    if not instance_id:
        return jsonify({"error": "Instance ID is required"}), 400
    metrics = get_instance_metrics(instance_id)
    return jsonify(metrics)

@app.route('/metrics/ec2/<instance_id>', methods=['GET'])
def ec2_metrics(instance_id):
    metrics = get_ec2_metrics(instance_id)
    return jsonify({"EC2 Metrics": metrics})

@app.route('/metrics/ebs/<volume_id>', methods=['GET'])
def ebs_metrics(volume_id):
    metrics = get_ebs_metrics(volume_id)
    return jsonify({"EBS Metrics": metrics})

# 🆕 Chatbot Route
@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.json
    user_message = data.get("message", "")
    bot_response = f"Echo: {user_message}"  # Replace with actual logic
    return jsonify({"reply": bot_response})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3000, debug=True)
