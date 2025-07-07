import { AlertCircle, X, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ErrorDetail {
  code?: string;
  message: string;
  longMessage?: string;
  meta?: any;
}

interface ErrorDisplayProps {
  error: string | ErrorDetail[] | any;
  type?: "error" | "warning" | "info" | "success";
  title?: string;
  onClose?: () => void;
  className?: string;
}

const ErrorDisplay = ({ 
  error, 
  type = "error", 
  title, 
  onClose, 
  className = "" 
}: ErrorDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to extract error details
  const extractErrorDetails = (error: any): ErrorDetail[] => {
    if (typeof error === "string") {
      return [{ message: error }];
    }
    
    if (Array.isArray(error)) {
      return error;
    }
    
    if (error?.errors && Array.isArray(error.errors)) {
      return error.errors;
    }
    
    if (error?.message) {
      return [{ message: error.message }];
    }
    
    return [{ message: "An unknown error occurred" }];
  };

  const errorDetails = extractErrorDetails(error);

  // Get icon and colors based on type
  const getTypeStyles = () => {
    switch (type) {
      case "warning":
        return {
          icon: AlertTriangle,
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-800",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-900"
        };
      case "info":
        return {
          icon: Info,
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-800",
          iconColor: "text-blue-600",
          titleColor: "text-blue-900"
        };
      case "success":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800",
          iconColor: "text-green-600",
          titleColor: "text-green-900"
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-800",
          iconColor: "text-red-600",
          titleColor: "text-red-900"
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.icon;

  // Helper function to get user-friendly error messages
  const getFriendlyMessage = (detail: ErrorDetail): string => {
    const { code, message } = detail;
    
    // Clerk specific errors
    if (code === "form_identifier_exists") {
      if (message.includes("email")) {
        return "This email address is already registered. Please use a different email.";
      }
      if (message.includes("username")) {
        return "This username is already taken. Please choose a different username.";
      }
    }
    
    if (code === "form_password_pwned") {
      return "This password has been compromised. Please choose a stronger password.";
    }
    
    if (code === "form_password_validation_failed") {
      return "Password doesn't meet security requirements. Please use a stronger password.";
    }
    
    // Username length error
    if (code === "form_username_invalid_length") {
      return "Username must be between 4 and 64 characters long.";
    }
    
    // Prisma specific errors
    if (message.includes("Unique constraint")) {
      if (message.includes("username")) {
        return "This username is already taken. Please choose a different username.";
      }
      if (message.includes("email")) {
        return "This email address is already registered. Please use a different email.";
      }
      if (message.includes("phone")) {
        return "This phone number is already registered. Please use a different phone number.";
      }
    }
    
    if (message.includes("Foreign key constraint")) {
      return "The referenced record doesn't exist. Please check your selection.";
    }
    
    if (message.includes("Record to update not found")) {
      return "The record you're trying to update doesn't exist.";
    }
    
    if (message.includes("Record to delete does not exist")) {
      return "The record you're trying to delete doesn't exist.";
    }
    
    // Network/API errors
    if (message.includes("fetch") || message.includes("network")) {
      return "Network error. Please check your internet connection and try again.";
    }
    
    if (message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    
    // Default fallback
    return message;
  };

  // Helper function to get error category
  const getErrorCategory = (detail: ErrorDetail): string => {
    const { code, message } = detail;
    
    if (code?.startsWith("form_")) {
      return "Authentication Error";
    }
    
    if (message.includes("Unique constraint")) {
      return "Validation Error";
    }
    
    if (message.includes("Foreign key constraint")) {
      return "Reference Error";
    }
    
    if (message.includes("Record") && (message.includes("not found") || message.includes("does not exist"))) {
      return "Data Error";
    }
    
    if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
      return "Network Error";
    }
    
    return "General Error";
  };

  return (
    <div className={`rounded-lg border p-4 ${styles.bgColor} ${className}`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`h-5 w-5 mt-0.5 ${styles.iconColor}`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`text-sm font-medium ${styles.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          
          <div className={`text-sm ${styles.textColor}`}>
            {errorDetails.length === 1 ? (
              <p>{getFriendlyMessage(errorDetails[0])}</p>
            ) : (
              <div>
                <p className="mb-2">Multiple errors occurred:</p>
                <ul className="space-y-1">
                  {errorDetails.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xs">•</span>
                      <span>{getFriendlyMessage(detail)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-white/20 transition-colors ${styles.textColor}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay; 