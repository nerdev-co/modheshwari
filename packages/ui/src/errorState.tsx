"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-jewel-ruby/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-jewel-ruby" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        Error
      </h3>
      <p className="text-sm text-text-secondary max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="mt-4">
          Try Again
        </Button>
      )}
    </div>
  );
}
