"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className = "", elevated = false }: CardProps) {
  return (
    <div className={`${elevated ? "card-elevated" : "card"} ${className}`}>
      {children}
    </div>
  );
}
