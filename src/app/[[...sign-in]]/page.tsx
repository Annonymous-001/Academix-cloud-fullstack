"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMoon, FiSun } from "react-icons/fi";

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [darkMode, setDarkMode] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const router = useRouter();

  // Handle page load
  useEffect(() => {
    setIsPageLoaded(true);
    const savedLoginTheme = localStorage.getItem("loginTheme");
    if (savedLoginTheme === "dark" || 
        (!savedLoginTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
    }
  }, []);

  // Handle authentication state
  useEffect(() => {
    const handleAuth = async () => {
      if (isLoaded && isSignedIn) {
        const role = user?.publicMetadata?.role as string;
        if (role) {
          // Force a hard navigation to the role-based route
          window.location.href = `/${role}`;
        }
      }
    };

    handleAuth();
  }, [isLoaded, isSignedIn, user]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem("loginTheme", darkMode ? "light" : "dark");
  };

  // Show loading state until Clerk has loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is already signed in, show loading
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Make sure we've completely loaded the page before rendering form
  if (!isPageLoaded) {
    return null;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${
      darkMode ? 'from-gray-900 to-gray-800 text-white' : 'from-lamaSkyLight to-blue-200'
    } transition-colors duration-500 overflow-hidden relative`}>
      {/* Theme toggle */}
      <motion.button
        className={`absolute top-6 right-6 p-2 rounded-full ${
          darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white text-gray-800'
        } shadow-lg z-20`}
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {darkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
      </motion.button>

      {/* Sign-in form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 relative"
      >
        <motion.div
          className={`${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          } p-12 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative z-10`}
        >
          <SignIn.Root>
            <SignIn.Step
              name="start"
              className="flex flex-col gap-4"
            >
              <motion.div 
                className="flex items-center justify-center mb-2"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="relative w-12 h-12 mr-3"
                >
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </motion.div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Academix Cloud
                </h1>
              </motion.div>
              
              <h2 className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                Sign in to your account
              </h2>
              
              <Clerk.GlobalError className="text-sm text-red-400" />
              
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Clerk.Field name="identifier" className="flex flex-col gap-2 mb-4">
                  <Clerk.Label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Username
                  </Clerk.Label>
                  <Clerk.Input
                    type="text"
                    required
                    className={`p-3 rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-blue-500' 
                        : 'bg-gray-50 ring-1 ring-gray-300 focus:ring-blue-500'
                    } focus:outline-none transition-all duration-300`}
                  />
                  <Clerk.FieldError className="text-xs text-red-400" />
                </Clerk.Field>
              </motion.div>
              
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Clerk.Field name="password" className="flex flex-col gap-2 mb-6">
                  <Clerk.Label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Password
                  </Clerk.Label>
                  <Clerk.Input
                    type="password"
                    required
                    className={`p-3 rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-blue-500' 
                        : 'bg-gray-50 ring-1 ring-gray-300 focus:ring-blue-500'
                    } focus:outline-none transition-all duration-300`}
                  />
                  <Clerk.FieldError className="text-xs text-red-400" />
                </Clerk.Field>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <SignIn.Action
                  submit
                  className={`w-full py-3 rounded-md font-medium text-white ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } transition-colors duration-300`}
                >
                  Sign In
                </SignIn.Action>
              </motion.div>
              
              <motion.p 
                className={`text-center text-xs mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                By signing in, you agree to our Terms of Service and Privacy Policy
              </motion.p>
            </SignIn.Step>
          </SignIn.Root>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
