"use client";

import React from "react";
import { Inbox } from "lucide-react";

import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Performs  empty state operation.
 * @param {EmptyStateProps} {
 *   icon: Icon = Inbox,
 *   title,
 *   description,
 *   action,
 * } - Description of {
 *   icon: Icon = Inbox,
 *   title,
 *   description,
 *   action,
 * }
 * @returns {any} Description of return value
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-ink-muted" />
      </div>
      <h3 className="text-heading font-display-bold text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-body text-ink-secondary max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}