import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // Point to backend on port 5000

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Add request interceptor for error handling
api.interceptors.request.use(
  (config) => {
    console.log("Making request to:", config.url);
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
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
    console.log("Response received:", response.status);
    return response;
  },
  (error) => {
    console.error("API Error:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });

    if (error.code === "ECONNREFUSED") {
      return Promise.reject(
        new Error(
          "Backend server is not running. Please start the backend server."
        )
      );
    } else if (error.code === "ERR_NETWORK") {
      return Promise.reject(
        new Error(
          "Network error. Please check your connection and backend server."
        )
      );
    } else if (error.response?.status === 404) {
      return Promise.reject(
        new Error("API endpoint not found. Please check the backend routes.")
      );
    }

    return Promise.reject(error);
  }
);

export const fetchInstances = async () => {
  try {
    console.log("Fetching instances...");
    const response = await api.get("/ec2/instances");
    console.log("Instances response:", response.data);

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return response.data.instances || [];
  } catch (error) {
    console.error("Error fetching instances:", error.message);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    console.log("Checking health...");
    const response = await api.get("/health");
    console.log("Health response:", response.data);
    return response.data.status;
  } catch (error) {
    console.error("Error checking health:", error.message);
    throw error;
  }
};

export const sendChatMessage = async (message) => {
  try {
    console.log("Sending chat message:", message);
    const response = await api.post("/chatbot", { message });
    console.log("Chat response:", response.data);
    return response.data.reply;
  } catch (error) {
    console.error("Error sending chat message:", error.message);
    throw error;
  }
};

export const fetchMetrics = async (instanceId) => {
  try {
    console.log("Fetching metrics for instance:", instanceId);
    const response = await api.get(
      `/monitor/metrics?instance_id=${instanceId}`
    );
    console.log("Metrics response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching metrics:", error.message);
    throw error;
  }
};

export const createAlarm = async (instanceId) => {
  try {
    console.log("Creating alarm for instance:", instanceId);
    const response = await api.post("/monitor/alarm", {
      instance_id: instanceId,
    });
    console.log("Alarm response:", response.data);
    return response.data.message;
  } catch (error) {
    console.error("Error creating alarm:", error.message);
    throw error;
  }
};
