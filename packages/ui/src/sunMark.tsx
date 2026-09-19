"use client";

import React from "react";

interface SunMarkProps {
  className?: string;
  wordmark?: boolean;
  size?: number;
}

/**
 * Performs  sun mark operation.
 * @param {SunMarkProps} {
 *   className = "",
 *   wordmark = true,
 *   size = 32,
 * } - Description of {
 *   className = "",
 *   wordmark = true,
 *   size = 32,
 * }
 * @returns {any} Description of return value
 */
export function SunMark({
  className = "",
  wordmark = true,
  size = 32,
}: SunMarkProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sunGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="50%" stopColor="var(--jewel-gold-light)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="12" fill="url(#sunGradient)" opacity="0.15" />
        <g stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="16" y1="26" x2="16" y2="30" />
          <line x1="2" y1="16" x2="6" y2="16" />
          <line x1="26" y1="16" x2="30" y2="16" />
          <line x1="6.1" y1="6.1" x2="9.2" y2="9.2" />
          <line x1="22.8" y1="22.8" x2="25.9" y2="25.9" />
          <line x1="6.1" y1="25.9" x2="9.2" y2="22.8" />
          <line x1="22.8" y1="9.2" x2="25.9" y2="6.1" />
        </g>
        <circle cx="16" cy="16" r="7" fill="var(--accent)" />
        <circle cx="16" cy="16" r="3" fill="var(--text-on-accent)" />
      </svg>
      {wordmark && (
        <span className="text-text-primary font-display text-lg leading-none font-semibold tracking-tight">
          Modheshwari
        </span>
      )}
    </div>
  );
}

SunMark.displayName = "SunMark";