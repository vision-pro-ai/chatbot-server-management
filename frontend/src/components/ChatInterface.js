"use client"; // Required for client-side interactions
import { useState, useEffect } from "react";
import {
  sendMessage,
  getInstanceState,
  getInstanceDetails,
  getInstanceLogs,
  getInstances,
} from "../services/api";

const exampleCommands = [
  {
    category: "Instance Management",
    commands: [
      "List all instances",
      "Check state of instance i-0258169e9696af1ee",
      "Start instance i-0258169e9696af1ee",
      "Stop instance i-0258169e9696af1ee",
      "Start all instances",
      "Stop all instances",
      "Tag instance i-0258169e9696af1ee with environment=production",
      "Tag instance i-0258169e9696af1ee with environment=production,owner=devops",
    ],
  },
  {
    category: "Instance Information",
    commands: [
      "Show all instances",
      "Show details for instance i-0258169e9696af1ee",
      "Show metrics for instance i-0258169e9696af1ee",
      "Show logs for instance i-0258169e9696af1ee",
      "What is the current state of instance i-0258169e9696af1ee?",
    ],
  },
  {
    category: "Monitoring",
    commands: [
      "Create alarm for instance i-0258169e9696af1ee",
      // "Check health of instance i-0258169e9696af1ee",
      "Show CPU usage for instance i-0258169e9696af1ee",
      "Show memory usage for instance i-0258169e9696af1ee",
    ],
  },
];

const ChatMessage = ({ message }) => {
  if (
    message.type === "bot" &&
    typeof message.content === "string" &&
    message.content.includes("<div")
  ) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div dangerouslySetInnerHTML={{ __html: message.content }} />
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg mb-4 ${
        message.type === "user"
          ? "bg-blue-100 ml-auto"
          : message.type === "error"
          ? "bg-red-100"
          : "bg-gray-100"
      }`}
    >
      <p className="text-gray-800">{message.content}</p>
    </div>
  );
};

export default function ChatInterface({ onResponse }) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExamples, setShowExamples] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [manualInstanceId, setManualInstanceId] = useState("");
  const [instances, setInstances] = useState([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(true);

  // Fetch instances when component mounts
  useEffect(() => {
    const fetchInstances = async () => {
      try {
        setIsLoadingInstances(true);
        const response = await getInstances();
        if (response && response.instances) {
          setInstances(response.instances);
        }
      } catch (error) {
        console.error("Error fetching instances:", error);
      } finally {
        setIsLoadingInstances(false);
      }
    };
    fetchInstances();
  }, []);

  const handleInstanceSelect = (instanceId) => {
    setSelectedInstance(instanceId);
    setShowExamples(true);
  };

  const handleManualInstanceSubmit = (e) => {
    e.preventDefault();
    if (manualInstanceId.trim()) {
      setSelectedInstance(manualInstanceId.trim());
      setShowExamples(true);
    }
  };

  const getInstanceSpecificGuidance = (instanceId) => {
    return [
      {
        category: "Instance Management",
        commands: [
          `Check state of instance ${instanceId}`,
          `Start instance ${instanceId}`,
          `Stop instance ${instanceId}`,
          `Tag instance ${instanceId} with environment=production`,
        ],
      },
      {
        category: "Instance Information",
        commands: [
          `Show details for instance ${instanceId}`,
          `Show metrics for instance ${instanceId}`,
          `Show logs for instance ${instanceId}`,
        ],
      },
      {
        category: "Monitoring",
        commands: [
          `Create alarm for instance ${instanceId}`,
          `Show CPU usage for instance ${instanceId}`,
          `Show memory usage for instance ${instanceId}`,
        ],
      },
    ];
  };

  const handleExampleClick = (command) => {
    setMessage(command);
    setShowExamples(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setShowExamples(false);

      // Add user message to chat history
      const userMessage = { type: "user", content: message };
      setChatHistory((prev) => [...prev, userMessage]);

      // Check if the message is asking for CPU usage
      const cpuUsageMatch = message.match(
        /show cpu usage for instance (i-[a-zA-Z0-9]+)/i
      );
      if (cpuUsageMatch) {
        const instanceId = cpuUsageMatch[1];
        try {
          const response = await getInstanceDetails(instanceId);
          const metrics = response.details["Metrics"];

          // Format CPU usage in a table
          const cpuUsageHtml = `
            <div class="overflow-x-auto">
              <h3 class="text-lg font-semibold mb-2">CPU Usage Metrics</h3>
              <table class="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="px-4 py-2">Metric</th>
                    <th class="px-4 py-2">Value</th>
                    <th class="px-4 py-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b">
                    <td class="px-4 py-2 font-medium">Average CPU Utilization</td>
                    <td class="px-4 py-2">${
                      metrics["CPUUtilization"] || "N/A"
                    }</td>
                    <td class="px-4 py-2">%</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-4 py-2 font-medium">CPU Credit Usage</td>
                    <td class="px-4 py-2">${
                      metrics["CPUCreditUsage"] || "N/A"
                    }</td>
                    <td class="px-4 py-2">Credits</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-4 py-2 font-medium">CPU Credit Balance</td>
                    <td class="px-4 py-2">${
                      metrics["CPUCreditBalance"] || "N/A"
                    }</td>
                    <td class="px-4 py-2">Credits</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-4 py-2 font-medium">CPU Surplus Credit Balance</td>
                    <td class="px-4 py-2">${
                      metrics["CPUSurplusCreditBalance"] || "N/A"
                    }</td>
                    <td class="px-4 py-2">Credits</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-4 py-2 font-medium">CPU Surplus Credits Charged</td>
                    <td class="px-4 py-2">${
                      metrics["CPUSurplusCreditsCharged"] || "N/A"
                    }</td>
                    <td class="px-4 py-2">Credits</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;

          const cpuUsageMessage = {
            type: "bot",
            content: cpuUsageHtml,
          };
          setChatHistory((prev) => [...prev, cpuUsageMessage]);
          setMessage("");
          return;
        } catch (error) {
          const errorMessage = {
            type: "error",
            content: `Failed to get CPU usage: ${
              error.response?.data?.error || error.message
            }`,
          };
          setChatHistory((prev) => [...prev, errorMessage]);
          setMessage("");
          return;
        }
      }

      // Check if the message is asking for instance logs
      const logsMatch = message.match(
        /show logs for instance (i-[a-zA-Z0-9]+)/i
      );
      if (logsMatch) {
        const instanceId = logsMatch[1];
        try {
          const logsResponse = await getInstanceLogs(instanceId);
          const logs = logsResponse.logs;

          // Format the logs in a tabular format
          const logsHtml = `
            <div class="overflow-x-auto">
              <h3 class="text-lg font-semibold mb-2">Recent Logs</h3>
              <table class="min-w-full bg-white border border-gray-200 mb-4">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="px-4 py-2">Timestamp</th>
                    <th class="px-4 py-2">Log Group</th>
                    <th class="px-4 py-2">Log Stream</th>
                    <th class="px-4 py-2">Message</th>
                  </tr>
                </thead>
                <tbody>
                  ${logs
                    .map(
                      (log) => `
                    <tr class="border-b">
                      <td class="px-4 py-2">${log.timestamp}</td>
                      <td class="px-4 py-2">${log.log_group}</td>
                      <td class="px-4 py-2">${log.log_stream}</td>
                      <td class="px-4 py-2">${log.message}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <h3 class="text-lg font-semibold mb-2">System Status</h3>
              <table class="min-w-full bg-white border border-gray-200">
                <tbody>
                  ${logsResponse.state_changes
                    .map(
                      (status) => `
                    <tr class="border-b">
                      <td class="px-4 py-2 font-medium bg-gray-50">Instance State</td>
                      <td class="px-4 py-2">${status.InstanceState.Name}</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-4 py-2 font-medium bg-gray-50">System Status</td>
                      <td class="px-4 py-2">${status.SystemStatus.Status}</td>
                    </tr>
                    <tr class="border-b">
                      <td class="px-4 py-2 font-medium bg-gray-50">Instance Status</td>
                      <td class="px-4 py-2">${status.InstanceStatus.Status}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `;

          const logsMessage = {
            type: "bot",
            content: logsHtml,
          };
          setChatHistory((prev) => [...prev, logsMessage]);
          setMessage("");
          return;
        } catch (error) {
          const errorMessage = {
            type: "error",
            content: `Failed to get instance logs: ${
              error.response?.data?.error || error.message
            }`,
          };
          setChatHistory((prev) => [...prev, errorMessage]);
          setMessage("");
          return;
        }
      }

      // Check if the message is asking for instance details
      const detailsMatch = message.match(
        /show details for instance (i-[a-zA-Z0-9]+)/i
      );
      if (detailsMatch) {
        const instanceId = detailsMatch[1];
        try {
          const detailsResponse = await getInstanceDetails(instanceId);
          const details = detailsResponse.details;

          // Format the details in a tabular format
          const detailsHtml = `
            <div class="overflow-x-auto">
              <h3 class="text-lg font-semibold mb-2">Basic Information</h3>
              <table class="min-w-full bg-white border border-gray-200 mb-4">
                <tbody>
                  ${Object.entries(details["Basic Information"])
                    .map(
                      ([key, value]) => `
                    <tr class="border-b">
                      <td class="px-4 py-2 font-medium bg-gray-50">${key}</td>
                      <td class="px-4 py-2">${
                        Array.isArray(value)
                          ? value.join(", ")
                          : typeof value === "object"
                          ? Object.entries(value)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")
                          : value
                      }</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <h3 class="text-lg font-semibold mb-2">Metrics</h3>
              <table class="min-w-full bg-white border border-gray-200 mb-4">
                <tbody>
                  ${Object.entries(details["Metrics"])
                    .map(
                      ([key, value]) => `
                    <tr class="border-b">
                      <td class="px-4 py-2 font-medium bg-gray-50">${key}</td>
                      <td class="px-4 py-2">${value}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <h3 class="text-lg font-semibold mb-2">Alarms</h3>
              <table class="min-w-full bg-white border border-gray-200 mb-4">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="px-4 py-2">Name</th>
                    <th class="px-4 py-2">State</th>
                    <th class="px-4 py-2">Metric</th>
                    <th class="px-4 py-2">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  ${details["Alarms"]
                    .map(
                      (alarm) => `
                    <tr class="border-b">
                      <td class="px-4 py-2">${alarm.Name}</td>
                      <td class="px-4 py-2">${alarm.State}</td>
                      <td class="px-4 py-2">${alarm.Metric}</td>
                      <td class="px-4 py-2">${alarm.Threshold}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <h3 class="text-lg font-semibold mb-2">System Logs</h3>
              <table class="min-w-full bg-white border border-gray-200">
                <tbody>
                  ${Object.entries(details["System Logs"])
                    .map(
                      ([key, value]) => `
                    <tr class="border-b">
                      <td class="px-4 py-2 font-medium bg-gray-50">${key}</td>
                      <td class="px-4 py-2">${
                        Array.isArray(value) ? value.join(", ") : value
                      }</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `;

          const detailsMessage = {
            type: "bot",
            content: detailsHtml,
          };
          setChatHistory((prev) => [...prev, detailsMessage]);
          setMessage("");
          return;
        } catch (error) {
          const errorMessage = {
            type: "error",
            content: `Failed to get instance details: ${
              error.response?.data?.error || error.message
            }`,
          };
          setChatHistory((prev) => [...prev, errorMessage]);
          setMessage("");
          return;
        }
      }

      // Check if the message is asking for instance state
      const stateCheckMatch = message.match(
        /check state of instance (i-[a-zA-Z0-9]+)/i
      );
      if (stateCheckMatch) {
        const instanceId = stateCheckMatch[1];
        try {
          const stateResponse = await getInstanceState(instanceId);
          const stateMessage = {
            type: "bot",
            content: `Instance ${instanceId} is currently ${stateResponse.state}`,
          };
          setChatHistory((prev) => [...prev, stateMessage]);
          setMessage("");
          return;
        } catch (error) {
          const errorMessage = {
            type: "error",
            content: `Failed to check instance state: ${
              error.response?.data?.error || error.message
            }`,
          };
          setChatHistory((prev) => [...prev, errorMessage]);
          setMessage("");
          return;
        }
      }

      // Send message to backend
      const response = await sendMessage(message);

      // Add bot response to chat history
      if (response.data && response.data.reply) {
        const botMessage = { type: "bot", content: response.data.reply };
        setChatHistory((prev) => [...prev, botMessage]);

        // If the response contains instance state information, format it nicely
        if (response.data.instanceState) {
          const stateMessage = {
            type: "bot",
            content: `Instance State: ${response.data.instanceState}\n\n${response.data.reply}`,
          };
          setChatHistory((prev) => [...prev, stateMessage]);
        }

        // Notify parent component of the response
        if (onResponse) {
          onResponse(response.data);
        }
      } else {
        // If no specific reply, provide guidance
        const guidanceMessage = {
          type: "bot",
          content:
            `I can help you with the following actions:\n\n` +
            `1. List all instances: "List all instances" or "Show all instances"\n` +
            `2. Check instance state: "Check state of instance i-0258169e9696af1ee"\n` +
            `3. Start/Stop instances: "Start instance i-0258169e9696af1ee" or "Stop instance i-0258169e9696af1ee"\n` +
            `4. View metrics: "Show metrics for instance i-0258169e9696af1ee"\n` +
            `5. Tag instances: "Tag instance i-0258169e9696af1ee with environment=production"\n\n` +
            `Click any example above or type your command.`,
        };
        setChatHistory((prev) => [...prev, guidanceMessage]);
      }

      // Clear input
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      let errorMessage = err.message;

      // Provide more user-friendly error messages
      if (err.message.includes("IncorrectInstanceState")) {
        errorMessage =
          "The instance is not in a state that allows it to be started. Please check the instance state first.";
      } else if (err.message.includes("InstanceNotFound")) {
        errorMessage =
          "The specified instance was not found. Please verify the instance ID.";
      } else if (err.message.includes("No response received")) {
        errorMessage =
          "I couldn't process your request. Please try one of these commands:\n\n" +
          '1. "List all instances" - to see available instances\n' +
          '2. "Check state of instance i-0258169e9696af1ee" - to check instance status\n' +
          '3. "Show metrics for instance i-0258169e9696af1ee" - to view instance metrics\n' +
          '4. "Tag instance i-0258169e9696af1ee with environment=production" - to add tags';
      }

      setError(errorMessage);

      // Add error message to chat history
      const errorMessageObj = { type: "error", content: errorMessage };
      setChatHistory((prev) => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeInstance = () => {
    setSelectedInstance(null);
    setManualInstanceId("");
    setShowExamples(true);
  };

  const generatePDFContent = (details) => {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h2 { color: #333; margin-top: 20px; }
            .section { margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <h1>Server Details Report</h1>
          
          <div class="section">
            <h2>Basic Information</h2>
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(details["Basic Information"])
                  .map(
                    ([key, value]) => `
                    <tr>
                      <td>${key}</td>
                      <td>${
                        Array.isArray(value) ? value.join(", ") : value
                      }</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Metrics</h2>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(details["Metrics"])
                  .map(
                    ([key, value]) => `
                    <tr>
                      <td>${key}</td>
                      <td>${value}</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Alarms</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>State</th>
                  <th>Metric</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                ${details["Alarms"]
                  .map(
                    (alarm) => `
                    <tr>
                      <td>${alarm.Name}</td>
                      <td>${alarm.State}</td>
                      <td>${alarm.Metric}</td>
                      <td>${alarm.Threshold}</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>System Logs</h2>
            <table>
              <thead>
                <tr>
                  <th>Log Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(details["System Logs"])
                  .map(
                    ([key, value]) => `
                    <tr>
                      <td>${key}</td>
                      <td>${
                        Array.isArray(value) ? value.join(", ") : value
                      }</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    return htmlContent;
  };

  const downloadPDF = async (instanceId) => {
    try {
      const response = await getInstanceDetails(instanceId);
      const details = response.details;

      // Create HTML content
      const htmlContent = generatePDFContent(details);

      // Create blob and download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `server-details-${instanceId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <h2 className="text-xl font-bold text-gray-800">
            Chat with Assistant
          </h2>
          {selectedInstance && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-sm text-blue-700 font-medium">
                {selectedInstance}
              </span>
              <button
                onClick={handleChangeInstance}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
        >
          {showExamples ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clipRule="evenodd"
                />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
              Hide Examples
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Show Examples
            </>
          )}
        </button>
      </div>

      {/* Instance Selection */}
      {!selectedInstance && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Select an Instance:
          </h3>

          {/* Manual Instance Entry */}
          <form onSubmit={handleManualInstanceSubmit} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInstanceId}
                onChange={(e) => setManualInstanceId(e.target.value)}
                placeholder="Enter instance ID (e.g., i-1234567890abcdef0)"
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!manualInstanceId.trim()}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Use Instance
              </button>
            </div>
          </form>

          {/* Instance List */}
          {isLoadingInstances ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : instances && instances.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Available Instances:
              </h4>
              {instances.map((instance) => (
                <button
                  key={instance.InstanceId}
                  onClick={() => handleInstanceSelect(instance.InstanceId)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200"
                >
                  {instance.InstanceId} ({instance.State})
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-sm py-2">
              No instances found. Please enter an instance ID manually.
            </div>
          )}
        </div>
      )}

      {/* Example Commands */}
      {showExamples && selectedInstance && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Available Commands for {selectedInstance}:
            </h3>
            <button
              onClick={() => downloadPDF(selectedInstance)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Download Details
            </button>
          </div>
          <div className="space-y-4">
            {getInstanceSpecificGuidance(selectedInstance).map(
              (category, index) => (
                <div key={index}>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">
                    {category.category}
                  </h4>
                  <div className="space-y-1">
                    {category.commands.map((cmd, cmdIndex) => (
                      <button
                        key={cmdIndex}
                        onClick={() => handleExampleClick(cmd)}
                        className="block w-full text-left px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="mb-4 h-96 overflow-y-auto space-y-4">
        {chatHistory.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            selectedInstance
              ? "Type your message or click an example above..."
              : "Please select an instance first..."
          }
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading || !selectedInstance}
        />
        <button
          type="submit"
          disabled={loading || !message.trim() || !selectedInstance}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
