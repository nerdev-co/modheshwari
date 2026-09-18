"use client";
import { type JSX, type ReactNode } from "react";

interface NotAuthenticatedProps {
  children?: ReactNode;
  className?: string;
}

export function NotAuthenticated({
  children,
  className = "",
}: NotAuthenticatedProps): JSX.Element {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen text-center px-4 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
        Not Authenticated
      </h1>
      <p className="text-text-secondary mb-6 max-w-md">
        You are not authorized to view this page. Please sign in to continue.
      </p>
      {children}
    </div>
  );
}
