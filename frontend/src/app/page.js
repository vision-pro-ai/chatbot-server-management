"use client";
import { useState, useEffect } from "react";
import { getInstances, startInstance, stopInstance } from "../services/api";
import ChatInterface from "../components/ChatInterface";
import MonitoringDashboard from "../components/MonitoringDashboard";
import TimeDisplay from "../components/TimeDisplay";

import "./globals.css";

export default function Home() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userCommand, setUserCommand] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInstances();

      if (response.data && response.data.instances) {
        // Ensure each instance has a unique identifier
        const processedInstances = response.data.instances.map((instance) => ({
          ...instance,
          id:
            instance.InstanceId ||
            instance["Instance ID"] ||
            Math.random().toString(36).substr(2, 9),
        }));

        setInstances(processedInstances);

        setRetryCount(0); // Reset retry count on success
      } else {
        setInstances([]);
        setError("No instances found in the response");
      }
    } catch (err) {
      console.error("Error loading instances:", err);
      setError(
        err.message || "Failed to load instances. Please try again later."
      );
      setInstances([]);

      // Auto-retry logic (max 3 retries)
      if (retryCount < 5) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => {
          loadInstances();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChatResponse = (response) => {
    console.log("Chat response received:", response);
    // Handle any specific actions based on chat response
  };

  const handleStartInstance = async (instanceId) => {
    try {
      setError(null);
      await startInstance(instanceId);
      await loadInstances(); // Refresh the list after starting
    } catch (err) {
      console.error("Error starting instance:", err);
      setError(err.message || "Failed to start instance. Please try again.");
    }
  };

  const handleStopInstance = async (instanceId) => {
    try {
      setError(null);
      await stopInstance(instanceId);
      await loadInstances(); // Refresh the list after stopping
    } catch (err) {
      console.error("Error stopping instance:", err);
      setError(err.message || "Failed to stop instance. Please try again.");
    }
  };

  const handleStartAllServers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Filter for stopped instances
      const stoppedInstances = instances.filter(
        (i) => (i.State || i["State"]) !== "running"
      );

      if (stoppedInstances.length === 0) {
        setError("No stopped instances found to start");
        return;
      }

      // Start each stopped instance
      const startPromises = stoppedInstances.map((instance) =>
        startInstance(instance.InstanceId || instance["Instance ID"])
      );

      await Promise.all(startPromises);
      await loadInstances(); // Refresh the list after starting all instances
    } catch (err) {
      console.error("Error starting all servers:", err);
      setError(err.message || "Failed to start all servers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStopAllServers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Filter for running instances
      const runningInstances = instances.filter(
        (i) => (i.State || i["State"]) === "running"
      );

      if (runningInstances.length === 0) {
        setError("No running instances found to stop");
        return;
      }

      // Stop each running instance
      const stopPromises = runningInstances.map((instance) =>
        stopInstance(instance.InstanceId || instance["Instance ID"])
      );

      await Promise.all(stopPromises);
      await loadInstances(); // Refresh the list after stopping all instances
    } catch (err) {
      console.error("Error stopping all servers:", err);
      setError(err.message || "Failed to stop all servers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Handle user command input
  const handleUserCommandChange = (e) => {
    setUserCommand(e.target.value);
  };

  // Handle user command submission
  const handleUserCommandSubmit = (e) => {
    e.preventDefault();
    console.log("User command submitted:", userCommand);
    // Process the command
    // ...
    setUserCommand("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              AWS Server Management
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {showSidebar ? "Hide" : "Show"} Dashboard
              </button>
              <button
                onClick={loadInstances}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Chat Interface - Now the primary element, taking up 60%+ of screen space */}
          <div
            className={`${
              showSidebar ? "md:w-3/5" : "w-full"
            } transition-all duration-300`}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                AI Server Assistant
              </h2>
            </div>

            {/* Chat messages area */}
            <div className="p-6 flex-grow overflow-y-auto">
              <ChatInterface onResponse={handleChatResponse} />
            </div>

            {/* Chat input area */}
          </div>

          {/* Collapsible Sidebar - Dashboard and Actions */}
          {showSidebar && (
            <div className="md:w-2/5 space-y-6">
              {/* Status Overview */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  System Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800">
                      Total Instances
                    </h3>
                    <p className="text-2xl font-semibold text-blue-900">
                      {instances.length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-800">
                      Running Instances
                    </h3>
                    <p className="text-2xl font-semibold text-green-900">
                      {
                        instances.filter(
                          (i) => (i.State || i["State"]) === "running"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-800">
                      Stopped Instances
                    </h3>
                    <p className="text-2xl font-semibold text-red-900">
                      {
                        instances.filter(
                          (i) => (i.State || i["State"]) !== "running"
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Quick Actions
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={handleStartAllServers}
                    disabled={
                      loading ||
                      instances.filter(
                        (i) => (i.State || i["State"]) !== "running"
                      ).length === 0
                    }
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Start All Servers
                  </button>
                  <button
                    onClick={handleStopAllServers}
                    disabled={
                      loading ||
                      instances.filter(
                        (i) => (i.State || i["State"]) === "running"
                      ).length === 0
                    }
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Stop All Servers
                  </button>
                </div>
              </div>

              {/* Monitoring Dashboard */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Instance Overview
                  </h2>
                </div>
                <div className="max-h-[30vh] overflow-auto">
                  <MonitoringDashboard
                    instances={instances}
                    loading={loading}
                    error={error}
                    onRefresh={loadInstances}
                    onStartInstance={handleStartInstance}
                    onStopInstance={handleStopInstance}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            AWS Server Management System - Last updated: <TimeDisplay />
          </p>
        </div>
      </footer>
    </div>
  );
}
