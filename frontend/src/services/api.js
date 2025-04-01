import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.10:3001";

export const fetchInstances = async () => {
  try {
    console.log(`🔗 Fetching from ${API_URL}/instances`);
    const response = await axios.get(`${API_URL}/instances`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("🚨 Axios Error:", error);
    throw error;
  }
};
