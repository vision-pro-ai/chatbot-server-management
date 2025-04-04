"use client";
import React, { useState, useEffect } from "react";
import { Box, VStack, Text, Spinner } from "@chakra-ui/react";
import { getInstances, startInstance, stopInstance } from "../services/api";

export default function MonitoringDashboard({
  instances,
  loading,
  error,
  onRefresh,
  onStartInstance,
  onStopInstance,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">EC2 Instances</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {instances.length === 0 ? (
        <p className="text-gray-500 text-center">No instances found</p>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <div
              key={instance.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {instance.InstanceId || instance["Instance ID"]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    State: {instance.State || instance["State"]}
                  </p>
                  <p className="text-sm text-gray-500">
                    Type: {instance.InstanceType || instance["Instance Type"]}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(instance.State === "stopped" ||
                    instance["State"] === "stopped") && (
                    <button
                      onClick={() =>
                        onStartInstance(
                          instance.InstanceId || instance["Instance ID"]
                        )
                      }
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Start
                    </button>
                  )}
                  {(instance.State === "running" ||
                    instance["State"] === "running") && (
                    <button
                      onClick={() =>
                        onStopInstance(
                          instance.InstanceId || instance["Instance ID"]
                        )
                      }
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
