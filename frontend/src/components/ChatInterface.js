"use client"; // Required for client-side interactions
import { useState } from "react";

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage = { text: input, sender: "user" };
    setMessages([...messages, userMessage]);
    setInput(""); // Clear input
  
    try {
      const response = await fetch("http://192.168.1.10:3000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
  
      const data = await response.json();
      setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [...prev, { text: "Error connecting to chatbot.", sender: "bot" }]);
    }
  };
  

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-md p-4 rounded-lg w-80">
      <h2 className="font-bold mb-2">Chatbot</h2>
      <div className="h-40 overflow-y-auto border p-2">
        {messages.map((msg, index) => (
          <p key={index} className="text-sm">{msg.text}</p>
        ))}
      </div>
      <input
        type="text"
        className="w-full p-2 border mt-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
    </div>
  );
}
