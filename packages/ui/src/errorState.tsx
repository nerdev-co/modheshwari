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
      <div className="w-14 h-14 rounded-full bg-ruby-soft flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-ruby" />
      </div>
      <h3 className="text-heading font-display-bold text-ink mb-2">Error</h3>
      <p className="text-body text-ink-secondary max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="mt-6">
          Try Again
        </Button>
      )}
    </div>
  );
}