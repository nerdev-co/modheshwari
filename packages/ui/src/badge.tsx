"use client";

import React from "react";

import { cn } from "./utils";

export type BadgeVariant =
  | "emerald"
  | "gold"
  | "ruby"
  | "neutral"
  | "accent"
  | "surface";

export type BadgeSize = "xs" | "sm" | "md" | "lg";

export type BadgeShape = "pill" | "rounded" | "square";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  solid?: boolean;
  border?: boolean;
  dot?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, { base: string; solid: string }> = {
  emerald: {
    base: "bg-emerald-soft text-emerald border-emerald/30",
    solid: "bg-emerald text-ink-on-accent",
  },
  gold: {
    base: "bg-saffron-soft text-saffron border-saffron/30",
    solid: "bg-saffron text-ink-on-accent",
  },
  ruby: {
    base: "bg-ruby-soft text-ruby border-ruby/30",
    solid: "bg-ruby text-ink-on-accent",
  },
  neutral: {
    base: "bg-surface-muted text-ink-muted border-border",
    solid: "bg-ink-muted text-ink-on-accent",
  },
  accent: {
    base: "bg-saffron-soft text-saffron border-saffron/30",
    solid: "bg-saffron text-ink-on-accent",
  },
  surface: {
    base: "bg-surface-muted text-ink-muted border-border",
    solid: "bg-surface-muted text-ink-muted",
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

const shapeClasses: Record<BadgeShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-lg",
  square: "rounded",
};

/**
 * Performs  badge operation.
 * @param {import("/Users/nalindalal/modheshwari/packages/ui/src/badge").BadgeProps} {
 *   variant = "neutral",
 *   size = "sm",
 *   shape = "pill",
 *   solid = false,
 *   border = true,
 *   dot = false,
 *   icon,
 *   className,
 *   children,
 *   ...rest
 * } - Description of {
 *   variant = "neutral",
 *   size = "sm",
 *   shape = "pill",
 *   solid = false,
 *   border = true,
 *   dot = false,
 *   icon,
 *   className,
 *   children,
 *   ...rest
 * }
 * @returns {any} Description of return value
 */
export function Badge({
  variant = "neutral",
  size = "sm",
  shape = "pill",
  solid = false,
  border = true,
  dot = false,
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  const v = variantClasses[variant];

  const dotColors: Record<BadgeVariant, string> = {
    emerald: "bg-emerald",
    gold: "bg-saffron",
    ruby: "bg-ruby",
    neutral: "bg-ink-muted",
    accent: "bg-saffron",
    surface: "bg-ink-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        sizeClasses[size],
        shapeClasses[shape],
        solid ? v.solid : v.base,
        border && !solid && "border",
        className,
      )}
      {...rest}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      )}
      {icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
      {children}
    </span>
  );
}