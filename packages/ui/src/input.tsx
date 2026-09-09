"use client";

import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || (label ? generatedId : undefined);

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary mb-1"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        className={`input ${className}`}
      />
    </div>
  );
}
