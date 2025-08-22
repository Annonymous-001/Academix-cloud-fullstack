"use client";

import { useEffect } from "react";
import NotificationPermission from "./NotificationPermission";

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  // Register service worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration);
          
          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Received message from service worker:', event.data);
            
            if (event.data && event.data.type === 'NAVIGATE') {
              // Handle navigation requests from service worker
              window.location.href = event.data.url;
            }
          });
          
          // Update service worker if needed
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available');
                  // Optionally notify user about update
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
          // Don't show this error to users as it's not critical for basic functionality
        });
    }
  }, []);

  return (
    <>
      {children}
      <NotificationPermission />
    </>
  );
};

export default NotificationProvider;
