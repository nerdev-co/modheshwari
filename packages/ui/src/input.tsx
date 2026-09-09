"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`input ${label ? "mt-1" : ""} ${className}`}
    />
  );
}
