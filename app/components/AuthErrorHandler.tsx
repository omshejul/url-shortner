"use client";

import { useEffect, useState } from "react";
import { clearNextAuthCookies } from "@/app/lib/auth-utils";

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

export default function AuthErrorHandler({ children }: AuthErrorHandlerProps) {
  const [showError, setShowError] = useState(false);
  const [hasCleared, setHasCleared] = useState(false);

  useEffect(() => {
    // Listen for authentication errors
    const handleAuthError = (event: CustomEvent) => {
      if (event.detail?.error === "JWEDecryptionFailed") {
        setShowError(true);
      }
    };

    window.addEventListener("auth-error" as any, handleAuthError);

    return () => {
      window.removeEventListener("auth-error" as any, handleAuthError);
    };
  }, []);

  const handleClearCookies = () => {
    clearNextAuthCookies();
    setHasCleared(true);
    setShowError(false);

    // Reload the page after clearing cookies
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (showError && !hasCleared) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Authentication Error
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              There was an issue with your authentication session. This usually
              happens when authentication cookies become corrupted.
            </p>
            <button
              onClick={handleClearCookies}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Clear Session & Reload
            </button>
            <p className="text-xs text-gray-400 mt-3">
              This will clear your authentication cookies and reload the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasCleared) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Clearing session and reloading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
