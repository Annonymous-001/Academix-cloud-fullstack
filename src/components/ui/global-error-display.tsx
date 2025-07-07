"use client";

import { useState, useEffect } from "react";
import ErrorDisplay from "./error-display";
import { AlertCircle, X } from "lucide-react";

interface GlobalError {
  id: string;
  message: string;
  details?: any;
  type?: "error" | "warning" | "info";
  timestamp: number;
}

interface GlobalErrorDisplayProps {
  className?: string;
}

const GlobalErrorDisplay = ({ className = "" }: GlobalErrorDisplayProps) => {
  const [errors, setErrors] = useState<GlobalError[]>([]);

  // Listen for global error events
  useEffect(() => {
    const handleGlobalError = (event: CustomEvent) => {
      const { message, details, type = "error" } = event.detail;
      const newError: GlobalError = {
        id: Date.now().toString(),
        message,
        details,
        type,
        timestamp: Date.now(),
      };
      
      setErrors(prev => [...prev, newError]);
    };

    // Listen for custom error events
    window.addEventListener("global-error" as any, handleGlobalError);
    
    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const newError: GlobalError = {
        id: Date.now().toString(),
        message: "An unexpected error occurred",
        details: event.reason,
        type: "error",
        timestamp: Date.now(),
      };
      
      setErrors(prev => [...prev, newError]);
    };

    // Listen for unhandled errors
    const handleUnhandledError = (event: ErrorEvent) => {
      const newError: GlobalError = {
        id: Date.now().toString(),
        message: "An unexpected error occurred",
        details: event.error,
        type: "error",
        timestamp: Date.now(),
      };
      
      setErrors(prev => [...prev, newError]);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleUnhandledError);

    return () => {
      window.removeEventListener("global-error" as any, handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleUnhandledError);
    };
  }, []);

  // Auto-remove errors after 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setErrors(prev => prev.filter(error => now - error.timestamp < 10000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  if (errors.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 max-w-md ${className}`}>
      {errors.map((error) => (
        <div
          key={error.id}
          className="animate-in slide-in-from-right-2 duration-300"
        >
          <ErrorDisplay
            error={error.details || error.message}
            type={error.type}
            title="System Error"
            onClose={() => removeError(error.id)}
            className="shadow-lg"
          />
        </div>
      ))}
    </div>
  );
};

// Utility function to dispatch global errors
export const dispatchGlobalError = (
  message: string, 
  details?: any, 
  type: "error" | "warning" | "info" = "error"
) => {
  const event = new CustomEvent("global-error", {
    detail: { message, details, type }
  });
  window.dispatchEvent(event);
};

export default GlobalErrorDisplay; 