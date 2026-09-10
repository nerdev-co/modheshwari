"use client";

import { ReactNode, useState, useRef, useId } from "react";

export default function Tooltip({
  children,
  text,
  className = "",
}: {
  children: ReactNode;
  text: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  const handleShow = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(true), 120);
  };
  const handleHide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 80);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      tabIndex={0}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
      onTouchStart={handleShow}
      onTouchEnd={handleHide}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleShow();
        if (e.key === "Escape") handleHide();
      }}
      aria-describedby={show ? tooltipId : undefined}
    >
      {children}

      <div
        id={tooltipId}
        role="tooltip"
        aria-hidden={!show}
        className={`pointer-events-none transition-opacity duration-150 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50 whitespace-nowrap rounded-md bg-jewel-900 text-jewel-50 text-xs py-1 px-2 shadow-lg ${
          show ? "opacity-100" : "opacity-0"
        }`}
        style={{
          minWidth: "max-content",
          maxWidth: 240,
        }}
      >
        {text}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-8 border-transparent border-t-jewel-900" />
      </div>
    </div>
  );
}
