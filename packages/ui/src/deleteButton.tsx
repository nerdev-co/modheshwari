"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "./confirmDialog";

interface DeleteButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  confirmMessage?: string;
}

export function DeleteButton({
  children = "Delete",
  confirmMessage = "Are you sure you want to delete this?",
  className = "",
  onClick,
  ...rest
}: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    setShowConfirm(false);
    onClick?.(e);
  };

  return (
    <>
      <button
        {...rest}
        onClick={handleClick}
        className={`
          group inline-flex items-center gap-3 px-3 py-1.5 rounded-md
          bg-jewel-ruby text-white font-medium shadow-md
          border border-jewel-ruby
          transition-all duration-300 ease-in-out
          hover:bg-surface hover:text-jewel-ruby hover:border-jewel-ruby
          focus:outline-none focus:ring-2 focus:ring-jewel-ruby focus:ring-offset-2
          ${className}
        `.trim()}
      >
        <span className="w-5 h-5 flex-shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-current"
            aria-hidden="true"
          >
            <g
              className="
                origin-center transition-transform duration-300 ease-out
                group-hover:-translate-y-1 group-hover:-rotate-8
              "
              style={{ transformOrigin: "12px 6px" }}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </g>

            <g
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 6l1 13a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l1-13" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </g>
          </svg>
        </span>

        <span className="text-sm font-medium">{children}</span>
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="Confirm Delete"
        description={confirmMessage}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

export default DeleteButton;
