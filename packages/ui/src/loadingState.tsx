"use client";

import React from "react";
import { LoaderOne } from "./loading";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md";
  className?: string;
}

export function LoadingState({
  message,
  size = "md",
  className = "",
}: LoadingStateProps) {
  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <LoaderOne />
        {message && (
          <span className="text-sm text-text-secondary">{message}</span>
        )}
      </span>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <LoaderOne />
      {message && (
        <p className="mt-3 text-sm text-text-secondary">{message}</p>
      )}
    </div>
  );
}
