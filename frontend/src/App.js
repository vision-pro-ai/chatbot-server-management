import React, { useState } from "react";
import {
  ChakraProvider,
  Box,
  VStack,
  Button,
  Text,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { fetchInstances, checkHealth, sendChatMessage } from "./services/api";

function App() {
  const [healthStatus, setHealthStatus] = useState("");
  const [instances, setInstances] = useState([]);
  const toast = useToast();

  // Test backend health
  const handleHealthCheck = async () => {
    try {
      const status = await checkHealth();
      setHealthStatus(status);
      toast({
        title: "Health Check",
        description: "Backend is healthy!",
        status: "success",
        duration: 30000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to backend",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Fetch EC2 instances
  const handleFetchInstances = async () => {
    try {
      const data = await fetchInstances();
      setInstances(data);
      toast({
        title: "Success",
        description: "Fetched EC2 instances successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch EC2 instances",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Test chatbot
  const handleTestChatbot = async () => {
    try {
      const reply = await sendChatMessage("List all instances");
      toast({
        title: "Chatbot Test",
        description: reply,
        status: "info",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test chatbot",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <ChakraProvider>
      <Box p={8}>
        <VStack spacing={8} align="stretch">
          <Heading>Backend Connection Test</Heading>

          <Box p={4} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Button colorScheme="blue" onClick={handleHealthCheck}>
                Check Backend Health
              </Button>
              <Text>Health Status: {healthStatus}</Text>
            </VStack>
          </Box>

          <Box p={4} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Button colorScheme="green" onClick={handleFetchInstances}>
                Fetch EC2 Instances
              </Button>
              <Box w="100%">
                <Text fontWeight="bold">Instances:</Text>
                {instances.map((instance, index) => (
                  <Box key={index} p={2} bg="gray.50" mb={2} borderRadius="md">
                    <Text>ID: {instance["Instance ID"]}</Text>
                    <Text>Type: {instance["Instance Type"]}</Text>
                    <Text>State: {instance["State"]}</Text>
                  </Box>
                ))}
              </Box>
            </VStack>
          </Box>

          <Box p={4} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Button colorScheme="purple" onClick={handleTestChatbot}>
                Test Chatbot
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
