"use client";

import { useState } from "react";
import { createTestNotification } from "@/lib/actions";

const TestNotificationButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleTestNotification = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await createTestNotification();
      if (result.success) {
        setMessage("✅ Test notification created! Check your notification dropdown.");
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setMessage("❌ Failed to create test notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <button
        onClick={handleTestNotification}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
      >
        {loading ? "Creating..." : "Test Notification"}
      </button>
      {message && (
        <p className="text-xs mt-2 text-gray-600 max-w-xs">{message}</p>
      )}
    </div>
  );
};

export default TestNotificationButton;
