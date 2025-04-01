"use client"; // Required for client-side interactions
import { useState } from "react";
import { sendChatMessage } from "../services/api";

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages([...messages, userMessage]);
    setInput(""); // Clear input

    try {
      const response = await sendChatMessage(input);
      setMessages((prev) => [...prev, { text: response, sender: "bot" }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: `Error: ${error.message || "Failed to connect to chatbot"}`,
          sender: "bot",
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-md p-4 rounded-lg w-80">
      <h2 className="font-bold mb-2">Chatbot</h2>
      <div className="h-40 overflow-y-auto border p-2">
        {messages.map((msg, index) => (
          <p
            key={index}
            className={`text-sm ${
              msg.sender === "user" ? "text-blue-600" : "text-gray-800"
            }`}
          >
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </p>
        ))}
      </div>
      <input
        type="text"
        className="w-full p-2 border mt-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        placeholder="Type your message..."
      />
    </div>
  );
}
