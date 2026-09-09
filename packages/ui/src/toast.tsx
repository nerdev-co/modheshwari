"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

const DEFAULT_DURATION = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (
      message: string,
      opts?: { variant?: ToastVariant; duration?: number },
    ) => {
      const id = `toast-${++counterRef.current}`;
      const duration = opts?.duration ?? DEFAULT_DURATION;
      setToasts((prev) => [...prev, { id, message, variant: opts?.variant ?? "info", duration }]);
    },
    [],
  );

  const ctx = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    "bg-emerald-50 border-emerald-500/20 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  error:
    "bg-ruby-50 border-ruby-500/20 text-ruby-600 dark:bg-ruby-950 dark:text-ruby-300",
  warning:
    "bg-accent-muted border-accent/20 text-accent-hover dark:bg-amber-950 dark:text-amber-300",
  info:
    "bg-surface border-border text-text-primary",
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: "\u2713",
  error: "\u2717",
  warning: "\u26A0",
  info: "\u2139",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`
        pointer-events-auto
        flex items-start gap-3
        rounded-xl border px-4 py-3
        shadow-medium
        min-w-[260px] max-w-[380px]
        ${VARIANT_STYLES[toast.variant]}
      `}
      role="alert"
    >
      <span className="text-base leading-none mt-0.5" aria-hidden="true">
        {VARIANT_ICONS[toast.variant]}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 text-current opacity-40 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </motion.div>
  );
}
