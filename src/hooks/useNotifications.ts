"use client";

import { useState, useEffect, useCallback } from "react";
import { getUnreadNotificationCount } from "@/lib/actions";

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUnreadNotificationCount();
      
      if (result.success && result.data) {
        setUnreadCount(result.data.count);
      } else {
        setError(result.message || "Failed to fetch notifications");
      }
    } catch (err) {
      setError("Error fetching notification count");
      console.error("Error fetching notification count:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Set up periodic refresh for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const refreshCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const decrementCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    loading,
    error,
    refreshCount,
    decrementCount,
    resetCount
  };
};
