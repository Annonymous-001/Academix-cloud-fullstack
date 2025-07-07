"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
}

const LoadingButton = ({
  loading = false,
  loadingText = "Loading...",
  children,
  variant = "default",
  size = "default",
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  };

  const sizeClasses = {
    default: "h-10 py-2 px-4",
    sm: "h-8 py-1 px-3 text-xs",
    lg: "h-12 py-3 px-6 text-base"
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {loading ? loadingText : children}
    </button>
  );
};

export default LoadingButton; 