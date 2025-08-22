"use client";

import { useState, useEffect, useCallback } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const NotificationPermission = () => {
  const { 
    isSupported, 
    isSubscribed, 
    error, 
    loading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [isClient, setIsClient] = useState(false);
  const [dismissedUntilNextSession, setDismissedUntilNextSession] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check notification permission status and localStorage dismissal
  useEffect(() => {
    if (!isClient || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const currentPermission = Notification.permission;
    setPermissionStatus(currentPermission);
    
    // Check if user dismissed this session
    const dismissedThisSession = sessionStorage.getItem('notification-prompt-dismissed');
    
    // Show prompt if:
    // 1. Permission is not granted
    // 2. Not dismissed this session
    // 3. Not permanently dismissed (for denied permissions)
    if (currentPermission !== "granted" && !dismissedThisSession) {
      // For denied permissions, check if permanently dismissed
      if (currentPermission === "denied") {
        const permanentlyDismissed = localStorage.getItem('notification-denied-dismissed');
        if (!permanentlyDismissed) {
          setShowPrompt(true);
        }
      } else {
        // For default permissions, always show
        setShowPrompt(true);
      }
    }
  }, [isClient]);

  // Listen for permission changes
  useEffect(() => {
    if (!isClient || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const checkPermissionChange = () => {
      const newPermission = Notification.permission;
      if (newPermission !== permissionStatus) {
        setPermissionStatus(newPermission);
        if (newPermission === "granted") {
          setShowPrompt(false);
          sessionStorage.removeItem('notification-prompt-dismissed');
          localStorage.removeItem('notification-denied-dismissed');
        }
      }
    };

    // Check permission changes periodically
    const interval = setInterval(checkPermissionChange, 1000);
    
    // Also check when window regains focus
    window.addEventListener('focus', checkPermissionChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkPermissionChange);
    };
  }, [isClient, permissionStatus]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    
    // For denied permissions, offer permanent dismissal
    if (permissionStatus === "denied") {
      localStorage.setItem('notification-denied-dismissed', 'true');
    } else {
      // For default permissions, dismiss only for this session
      sessionStorage.setItem('notification-prompt-dismissed', 'true');
    }
    
    setDismissedUntilNextSession(true);
  }, [permissionStatus]);

  const handleEnable = useCallback(async () => {
    try {
      // First request notification permission
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission !== "granted") {
          return;
        }
      }
      
      // Then subscribe to push notifications
      const success = await subscribe();
      if (success) {
        setShowPrompt(false);
        sessionStorage.removeItem('notification-prompt-dismissed');
        localStorage.removeItem('notification-denied-dismissed');
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      // Error will be displayed by the usePushNotifications hook
    }
  }, [subscribe]);

  const handleRemindLater = useCallback(() => {
    setShowPrompt(false);
    // Set a shorter session dismissal for "remind later"
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
  }, []);

  // Don't render on server side
  if (!isClient) {
    return null;
  }

  // Only show if supported, not subscribed, permission not granted, and prompt should be shown
  if (!isSupported || isSubscribed || permissionStatus === "granted" || !showPrompt) {
    return null;
  }

  // If push notifications are not supported, show a different message
  if (!isSupported) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2C6.686 2 4 4.686 4 8c0 2.5 1.5 4.5 3 6l3 4 3-4c1.5-1.5 3-3.5 3-6 0-3.314-2.686-6-6-6z" />
                <circle cx="10" cy="8" r="2" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              In-App Notifications Available
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Push notifications are not supported in this browser, but you can still receive in-app notifications.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleDismiss}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50 animate-slide-up">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            permissionStatus === "denied" ? "bg-red-100" : "bg-purple-100"
          }`}>
            {permissionStatus === "denied" ? (
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2C6.686 2 4 4.686 4 8c0 2.5 1.5 4.5 3 6l3 4 3-4c1.5-1.5 3-3.5 3-6 0-3.314-2.686-6-6-6z" />
                <circle cx="10" cy="8" r="2" />
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {permissionStatus === "denied" ? "Notifications Blocked" : "Enable Push Notifications"}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {permissionStatus === "denied" ? (
              "Notifications are blocked. To receive important updates, please enable them in your browser settings."
            ) : (
              "Get instant alerts for classes, exams, assignments, and announcements directly in your browser."
            )}
          </p>
          
          {/* Show current browser info for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded">
              Debug: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'} | 
              Permission: {permissionStatus} | 
              Supported: {isSupported ? 'Yes' : 'No'}
            </div>
          )}
          
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-700">
                <span className="font-semibold">Error:</span> {error}
              </p>
              {error.includes("VAPID") && (
                <p className="text-xs text-red-600 mt-1">
                  💡 In-app notifications will still work normally.
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-col space-y-2 mt-3">
            {permissionStatus === "denied" ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                  <p className="font-semibold text-blue-800">How to enable:</p>
                  <p>1. Click the 🔒 lock icon in your address bar</p>
                  <p>2. Set Notifications to &quot;Allow&quot;</p>
                  <p>3. Refresh this page</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Don&apos;t show again
                  </button>
                  <button
                    onClick={handleRemindLater}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                  >
                    Remind later
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleEnable}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Enabling...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2C6.686 2 4 4.686 4 8c0 2.5 1.5 4.5 3 6l3 4 3-4c1.5-1.5 3-3.5 3-6 0-3.314-2.686-6-6-6z" />
                      </svg>
                      <span>Enable</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleRemindLater}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Later
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationPermission;
