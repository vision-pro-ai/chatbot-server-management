
import ChatInterface from "../components/ChatInterface";
import MonitoringDashboard from "../components/MonitoringDashboard";

export default function HomePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">AWS Server Management System</h1>
      <p className="text-gray-600">Welcome to the dashboard.</p>

      {/* Monitoring Dashboard */}
      <MonitoringDashboard />

      {/* Chatbot Interface */}
      <ChatInterface />
    </div>
  );
}
