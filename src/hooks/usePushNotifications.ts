"use client";

import { useState, useEffect } from "react";

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  error: string | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    error: null
  });

  const [loading, setLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setState(prev => ({ ...prev, isSupported: true }));
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription
      }));
    } catch (error) {
      console.error("Error checking push subscription:", error);
      setState(prev => ({
        ...prev,
        error: "Failed to check subscription status"
      }));
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      setState(prev => ({
        ...prev,
        error: "This browser does not support notifications"
      }));
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      setState(prev => ({
        ...prev,
        error: "Notifications are blocked. Please enable them in your browser settings."
      }));
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return true;
    } else {
      setState(prev => ({
        ...prev,
        error: "Notification permission denied"
      }));
      return false;
    }
  };

  const subscribe = async () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: "Push notifications are not supported"
      }));
      return false;
    }

    setLoading(true);
    setState(prev => ({ ...prev, error: null }));

    try {
      // Request notification permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setLoading(false);
        return false;
      }

      // Register service worker if not already registered
      const swRegistration = await registerServiceWorker();
      
      if (!swRegistration) {
        setState(prev => ({
          ...prev,
          error: "Service worker registration failed. Push notifications may not work properly."
        }));
        setLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // VAPID keys are required for push notifications in production
      // To set up VAPID keys:
      // 1. Generate VAPID keys using: npx web-push generate-vapid-keys
      // 2. Add to your .env.local file:
      //    NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
      //    VAPID_PRIVATE_KEY=your_private_key_here
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      let subscription;
      try {
        if (!vapidPublicKey) {
          console.warn("VAPID key not configured. Push notifications may not work properly.");
          // For development/testing, we can still register without VAPID
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true
          });
        } else {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
        }
      } catch (subscriptionError) {
        console.error("Push subscription error:", subscriptionError);
        // If push subscription fails, we'll still mark as subscribed for in-app notifications
        // This allows the notification system to work even without push
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          subscription: null
        }));
        setLoading(false);
        return true; // Return true to close the prompt
      }

      // Send subscription to server (only if we have a subscription)
      if (subscription) {
        try {
          const response = await fetch("/api/notifications/push-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(subscription)
          });

          if (!response.ok) {
            console.warn("Failed to save subscription to server, but continuing...");
          }
        } catch (serverError) {
          console.warn("Server error saving subscription:", serverError);
          // Don't fail the whole process if server save fails
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription
      }));

      setLoading(false);
      return true;
         } catch (error) {
       console.error("Error subscribing to push notifications:", error);
       let errorMessage = "Failed to subscribe to notifications";
       
               // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes("permission")) {
            errorMessage = "Notification permission denied";
          } else if (error.message.includes("service worker")) {
            errorMessage = "Service worker registration failed";
          } else if (error.message.includes("subscription")) {
            errorMessage = "Push subscription failed, but in-app notifications will still work";
          } else if (error.message.includes("VAPID")) {
            errorMessage = "Push notifications not configured, but in-app notifications will work";
          }
        }
       
       setState(prev => ({
         ...prev,
         error: errorMessage
       }));
       setLoading(false);
       return false;
     }
  };

  const unsubscribe = async () => {
    if (!state.subscription) return false;

    setLoading(true);
    setState(prev => ({ ...prev, error: null }));

    try {
      await state.subscription.unsubscribe();

      // Remove subscription from server
      await fetch("/api/notifications/push-subscription", {
        method: "DELETE"
      });

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null
      }));

      setLoading(false);
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      setState(prev => ({
        ...prev,
        error: "Failed to unsubscribe from notifications"
      }));
      setLoading(false);
      return false;
    }
  };

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);
        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        // Don't throw error, just log it and continue
        // The push subscription might still work without the service worker
        return null;
      }
    }
    return null;
  };

  return {
    ...state,
    loading,
    subscribe,
    unsubscribe,
    requestPermission
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
