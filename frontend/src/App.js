export async function fetchInstanceMetrics(instanceId) {
    const response = await fetch(`/monitor/metrics?instance_id=${instanceId}`);
    return response.json();
}
