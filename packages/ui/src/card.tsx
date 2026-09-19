"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  padded?: boolean;
}

export function Card({ children, className = "", elevated = false, padded = true }: CardProps) {
  return (
    <div className={`${elevated ? "shadow-soft" : ""} rounded-xl border ${padded ? "p-6" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-heading font-display-bold text-ink ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-body text-ink-secondary mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-4 pt-4 border-t border-border ${className}`}>{children}</div>;
}