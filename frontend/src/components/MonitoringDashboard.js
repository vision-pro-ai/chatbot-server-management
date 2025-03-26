import React, { useEffect, useState } from "react";
import { fetchInstanceMetrics } from "../services/api";

const MonitoringDashboard = ({ instanceId }) => {
    const [metrics, setMetrics] = useState([]);

    useEffect(() => {
        fetchInstanceMetrics(instanceId).then(data => setMetrics(data.Metrics));
    }, [instanceId]);

    return (
        <div>
            <h2>Monitoring Dashboard</h2>
            <ul>
                {metrics.map((metric, index) => (
                    <li key={index}>{metric}</li>
                ))}
            </ul>
        </div>
    );
};

export default MonitoringDashboard;
