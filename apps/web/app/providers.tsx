"use client";

import { ToastProvider } from "@repo/ui/toast";

import { UserProvider } from "../lib/UserContext";
import { ErrorBoundary } from "./errorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <UserProvider>{children}</UserProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
