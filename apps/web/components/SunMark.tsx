"use client";

export function SunMark({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.15" />
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1={16}
            y1={16}
            x2={16 + 12 * Math.cos((angle * Math.PI) / 180)}
            y2={16 + 12 * Math.sin((angle * Math.PI) / 180)}
          />
        ))}
      </g>
      <circle cx="16" cy="16" r="5" fill="currentColor" />
    </svg>
  );
}