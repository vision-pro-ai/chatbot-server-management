import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout:", error);
      throw new Error(
        "Connection timeout. Please check if the backend server is running."
      );
    } else if (error.code === "ERR_NETWORK") {
      console.error("Network error:", error);
      throw new Error(
        "Unable to connect to the server. Please check if the backend server is running."
      );
    } else if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
      throw new Error(
        error.response.data.error ||
          "An error occurred while processing your request."
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error(
        "No response received from the server. Please check if the backend server is running."
      );
    } else {
      console.error("Error setting up request:", error.message);
      throw new Error("An unexpected error occurred. Please try again later.");
    }
  }
);

// API endpoints
const endpoints = {
  // Instance Management
  getInstances: () => api.get("/ec2/instances"),
  startInstance: (instanceId) => api.post(`/ec2/instances/${instanceId}/start`),
  stopInstance: (instanceId) => api.post(`/ec2/instances/${instanceId}/stop`),
  getInstanceDetails: async (instanceId) => {
    try {
      const response = await api.get(`/ec2/instances/${instanceId}/details`);
      return response.data;
    } catch (error) {
      console.error("Error getting instance details:", error);
      throw error;
    }
  },
  tagInstance: (instanceId, tags) =>
    api.post("/ec2/tag", { instance_id: instanceId, tags }),
  decommissionInstance: (instanceId) =>
    api.post("/ec2/decommission", { instance_id: instanceId }),

  // Monitoring
  getInstanceMetrics: (instanceId) => api.get(`/metrics/ec2/${instanceId}`),
  getEbsMetrics: (volumeId) => api.get(`/metrics/ebs/${volumeId}`),
  getInstanceLogs: async (instanceId) => {
    try {
      const response = await api.get(`/ec2/instances/${instanceId}/logs`);
      return response.data;
    } catch (error) {
      console.error("Error getting instance logs:", error);
      throw error;
    }
  },
  checkInstanceHealth: (instanceId) =>
    api.get("/monitor/health", { params: { instance_id: instanceId } }),
  createAlarm: (instanceId) =>
    api.post("/monitor/alarm", { instance_id: instanceId }),

  // Chat
  sendMessage: (message) => api.post("/chatbot", { message }),
  healthCheck: () => api.get("/health"),

  // New function to check instance state
  getInstanceState: async (instanceId) => {
    try {
      const response = await api.get(`/ec2/instances/${instanceId}/state`);
      return response.data;
    } catch (error) {
      console.error("Error checking instance state:", error);
      throw error;
    }
  },
};

// Export individual functions
export const {
  getInstances,
  startInstance,
  stopInstance,
  getInstanceDetails,
  tagInstance,
  decommissionInstance,
  getInstanceMetrics,
  getEbsMetrics,
  getInstanceLogs,
  checkInstanceHealth,
  createAlarm,
  sendMessage,
  healthCheck,
  getInstanceState,
} = endpoints;

// Export default object with all functions
export default endpoints;
