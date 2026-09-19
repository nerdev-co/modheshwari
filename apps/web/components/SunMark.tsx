"use client";

/**
 * Performs  sun mark operation.
 * @param {{ className?: string; size?: number; }} { className = "", size = 32 } - Description of { className = "", size = 32 }
 * @returns {React.JSX.Element} Description of return value
 */
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
      <defs>
        <linearGradient id="sunGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="50%" stopColor="#d4a017" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="12" fill="url(#sunGradient)" opacity="0.15" />
      <g stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1={16}
            y1={16}
            x2={16 + 10 * Math.cos((angle * Math.PI) / 180)}
            y2={16 + 10 * Math.sin((angle * Math.PI) / 180)}
          />
        ))}
      </g>
      <circle cx="16" cy="16" r="7" fill="var(--accent)" />
      <circle cx="16" cy="16" r="3" fill="var(--text-on-accent)" />
    </svg>
  );
}