/**
 * Dreamy Sunset Background Component
 * Provides a consistent sunset gradient background across all pages
 * Inspired by the Surya Kund at Modhera Sun Temple
 */

import React from "react";

interface DreamySunsetBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function DreamySunsetBackground({
  children,
  className = "",
}: DreamySunsetBackgroundProps) {
  return (
    <div className={`min-h-screen w-full relative bg-surface ${className}`}>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-surface via-surface-muted to-surface" aria-hidden="true" />

      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-emerald/10 rounded-full blur-3xl" aria-hidden="true" />

      <div className="absolute inset-0 z-0 suryakund-pattern opacity-20" aria-hidden="true" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}