"use client";

import { ToastProvider } from "@repo/ui/toast";
import { MotionConfig } from "framer-motion";

import { UserProvider } from "../lib/UserContext";
import { ErrorBoundary } from "./errorBoundary";

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
