"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { MOTION_ENTER, MOTION_EXIT } from "./motion";
import { useFocusTrap } from "./useFocusTrap";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES: Record<string, string> = {
  danger: "bg-ruby-500 text-white hover:bg-ruby-600 focus:ring-ruby-500",
  warning: "bg-accent text-jewel-900 hover:bg-accent-hover focus:ring-accent",
  info: "bg-accent text-jewel-900 hover:bg-accent-hover focus:ring-accent",
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  useFocusTrap(dialogRef, open, {
    onClose: onCancel,
    returnFocus: cancelRef,
  });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION_EXIT}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MOTION_EXIT}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />

          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={MOTION_ENTER}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-elevated"
          >
            <h2
              id="confirm-title"
              className="text-lg font-semibold text-text-primary"
            >
              {title}
            </h2>
            <p
              id="confirm-desc"
              className="mt-2 text-sm text-text-secondary leading-relaxed"
            >
              {description}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-text-secondary rounded-xl border border-border hover:bg-surface-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] ${VARIANT_STYLES[variant]}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
