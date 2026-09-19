"use client";

import React, { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      className = "",
      disabled,
      ...rest
    },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-fast active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "px-3.5 py-1.5 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary: `
        bg-saffron text-ink-on-accent font-semibold
        hover:bg-saffron-hover
        focus-visible:ring-saffron
      `,
      secondary: `
        bg-transparent text-ink font-medium
        border border-border
        hover:bg-surface-muted hover:border-ink-muted
        focus-visible:ring-saffron
      `,
      ghost: `
        bg-transparent text-ink-secondary font-medium
        hover:bg-surface-muted hover:text-ink
        focus-visible:ring-saffron
      `,
      danger: `
        bg-ruby text-ink-on-accent font-semibold
        hover:bg-ruby/90
        focus-visible:ring-ruby
      `,
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";