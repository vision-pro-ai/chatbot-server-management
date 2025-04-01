"use client";
import { useEffect, useState } from "react";
import { fetchInstances } from "../services/api";

export default function MonitoringDashboard() {
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    const loadInstances = async () => {
      const data = await fetchInstances();
      setInstances(data);
    };
    loadInstances();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold">Server Monitoring</h1>
      <ul>
        {instances.map((instance) => (
          <li key={instance.id} className="p-2 border rounded-md my-2">
            {instance.name} - {instance.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
