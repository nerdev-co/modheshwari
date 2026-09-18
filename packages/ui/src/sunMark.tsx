"use client";

import React from "react";

interface SunMarkProps {
    className?: string;
    wordmark?: boolean;
    size?: number;
}

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
                <circle cx="16" cy="16" r="7" fill="var(--accent)" />
                <g
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                >
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="16" y1="26" x2="16" y2="30" />
                    <line x1="2" y1="16" x2="6" y2="16" />
                    <line x1="26" y1="16" x2="30" y2="16" />
                    <line x1="6.1" y1="6.1" x2="9.2" y2="9.2" />
                    <line x1="22.8" y1="22.8" x2="25.9" y2="25.9" />
                    <line x1="6.1" y1="25.9" x2="9.2" y2="22.8" />
                    <line x1="22.8" y1="9.2" x2="25.9" y2="6.1" />
                </g>
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
