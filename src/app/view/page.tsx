"use client";

import WebSocketIndicator from "@/components/WebSocketIndicator";

export default function ViewPage() {
  return (
    <div className="min-h-screen p-8">
      <WebSocketIndicator endpoint="ws://localhost:8000" />
      <h1 className="text-2xl font-bold mb-4">View Page</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <p className="text-gray-600 dark:text-gray-300">
          View content will be displayed here
        </p>
      </div>
    </div>
  );
}
