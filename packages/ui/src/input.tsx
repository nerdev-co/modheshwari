"use client";

import React, { useId, forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || (label ? generatedId : undefined);

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          {...props}
          id={inputId}
          className={`input ${className}`}
        />
      </div>
    );
  },
);

Input.displayName = "Input";