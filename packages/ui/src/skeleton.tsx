"use client";

import React from "react";

import { cn } from "./utils";

export type SkeletonVariant = "text" | "circle" | "rectangle" | "card";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const variantDefaults: Record<SkeletonVariant, { width: string; height: string }> = {
  text: { width: "100%", height: "1rem" },
  circle: { width: "2.5rem", height: "2.5rem" },
  rectangle: { width: "100%", height: "10rem" },
  card: { width: "100%", height: "8rem" },
};

/**
 * Performs  skeleton operation.
 * @param {import("/Users/nalindalal/modheshwari/packages/ui/src/skeleton").SkeletonProps} {
 *   variant = "text",
 *   width,
 *   height,
 *   lines = 1,
 *   className,
 *   style,
 *   ...rest
 * } - Description of {
 *   variant = "text",
 *   width,
 *   height,
 *   lines = 1,
 *   className,
 *   style,
 *   ...rest
 * }
 * @returns {any} Description of return value
 */
export function Skeleton({
  variant = "text",
  width,
  height,
  lines = 1,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const defaults = variantDefaults[variant];

  const w = width ?? defaults.width;
  const h = height ?? defaults.height;

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded bg-surface-muted"
            style={{
              width: i === lines - 1 ? "70%" : w,
              height: h,
              ...style,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-surface-muted",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded",
        variant === "rectangle" && "rounded-xl",
        variant === "card" && "rounded-2xl",
        className,
      )}
      style={{ width: w, height: h, ...style }}
      {...rest}
    />
  );
}

/**
 * Performs  skeleton card operation.
 * @param {{ className?: string; }} { className } - Description of { className }
 * @returns {any} Description of return value
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card p-5 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width="2.5rem" height="2.5rem" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="40%" height="0.875rem" />
          <Skeleton variant="text" width="25%" height="0.75rem" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
      <div className="flex gap-2">
        <Skeleton variant="text" width="4rem" height="1.75rem" />
        <Skeleton variant="text" width="4rem" height="1.75rem" />
      </div>
    </div>
  );
}

/**
 * Performs  skeleton table operation.
 * @param {{ rows?: number; cols?: number; }} { rows = 5, cols = 4 } - Description of { rows = 5, cols = 4 }
 * @returns {any} Description of return value
 */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" height="1rem" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" height="2.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
