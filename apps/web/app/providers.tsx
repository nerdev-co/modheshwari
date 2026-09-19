"use client";

import { ToastProvider } from "@repo/ui/toast";
import { MotionConfig } from "framer-motion";

import { UserProvider } from "../lib/UserContext";
import { ErrorBoundary } from "./errorBoundary";

/**
 * Performs  providers operation.
 * @param {{ children: React.ReactNode; }} { children } - Description of { children }
 * @returns {React.JSX.Element} Description of return value
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <UserProvider>{children}</UserProvider>
        </ToastProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
