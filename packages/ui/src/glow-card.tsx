"use client";

import { useRef, type ReactNode } from "react";

/**
 * Performs  glow card operation.
 * @param {{ children: React.ReactNode; className?: string; }} {
 *   children,
 *   className = "",
 * } - Description of {
 *   children,
 *   className = "",
 * }
 * @returns {React.JSX.Element} Description of return value
 */
export function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--glow-x", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--glow-y", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`relative overflow-hidden rounded-2xl border border-jewel-400/20
        bg-jewel-50/60 backdrop-blur-sm
        before:content-[''] before:absolute before:inset-0 before:opacity-0
        hover:before:opacity-100 before:transition-opacity before:duration-300
        before:[background:radial-gradient(250px_circle_at_var(--glow-x)_var(--glow-y),rgba(201,162,39,0.12),transparent_70%)]
        hover:border-jewel-gold/40 hover:shadow-jewel transition-all duration-300 hover:scale-[1.02]
        dark:border-jewel-400/10 dark:bg-jewel-900/60
        ${className}`}
    >
      {children}
    </div>
  );
}
