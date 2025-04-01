"use client";
import React, { useState, useEffect } from "react";
import { Box, VStack, Text, Spinner } from "@chakra-ui/react";
import { fetchInstances } from "../services/api";

const MonitoringDashboard = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInstances = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchInstances();
        setInstances(data);
      } catch (err) {
        console.error("Error loading instances:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInstances();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="200px"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderRadius="md">
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        EC2 Instances
      </Text>
      {instances.length === 0 ? (
        <Text>No instances found</Text>
      ) : (
        instances.map((instance, index) => (
          <Box key={index} p={4} borderWidth={1} borderRadius="md">
            <Text>ID: {instance["Instance ID"]}</Text>
            <Text>Type: {instance["Instance Type"]}</Text>
            <Text>State: {instance["State"]}</Text>
          </Box>
        ))
      )}
    </VStack>
  );
};

export default MonitoringDashboard;
