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
    base: "bg-jewel-emerald/10 text-jewel-emerald border-jewel-emerald/20",
    solid: "bg-jewel-emerald text-jewel-deep",
  },
  gold: {
    base: "bg-jewel-gold/10 text-jewel-gold border-jewel-gold/20",
    solid: "bg-jewel-gold text-jewel-deep",
  },
  ruby: {
    base: "bg-jewel-ruby/10 text-jewel-ruby border-jewel-ruby/20",
    solid: "bg-jewel-ruby text-white",
  },
  neutral: {
    base: "bg-jewel-400/10 text-jewel-600 border-jewel-400/20",
    solid: "bg-jewel-500 text-jewel-deep",
  },
  accent: {
    base: "bg-accent-muted text-accent border-accent/20",
    solid: "bg-accent text-on-accent",
  },
  surface: {
    base: "bg-surface-muted text-text-muted border-border",
    solid: "bg-surface-muted text-text-muted",
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[10px]",
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

const shapeClasses: Record<BadgeShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-lg",
  square: "rounded",
};

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
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            variant === "emerald" && "bg-jewel-emerald",
            variant === "gold" && "bg-jewel-gold",
            variant === "ruby" && "bg-jewel-ruby",
            variant === "neutral" && "bg-jewel-400",
            variant === "accent" && "bg-accent",
            variant === "surface" && "bg-text-muted",
          )}
        />
      )}
      {icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
      {children}
    </span>
  );
}
