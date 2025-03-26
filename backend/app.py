from flask import Flask, jsonify, request
from backend.aws.monitoring import get_instance_metrics

app = Flask(__name__)

@app.route('/monitor/metrics', methods=['GET'])

def fetch_metrics():
    instance_id = request.args.get('instance_id')
    if not instance_id:
        return jsonify({"error": "Instance ID is required"}), 400
    metrics = get_instance_metrics(instance_id)
    return jsonify(metrics)
