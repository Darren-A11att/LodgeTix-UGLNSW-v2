"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ 
  error,
  reset,
}: { 
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
          <div className="bg-white shadow-lg rounded-lg max-w-lg w-full p-8 text-center">
            <h1 className="text-2xl font-bold text-masonic-navy mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. Please try again or contact support if the issue persists.
            </p>
            <button
              onClick={() => {
                if (typeof reset === 'function') {
                  reset();
                } else {
                  // Fallback to page reload if reset is not available
                  window.location.reload();
                }
              }}
              className="inline-block bg-masonic-navy text-white px-6 py-2 rounded-md hover:bg-masonic-navy/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}