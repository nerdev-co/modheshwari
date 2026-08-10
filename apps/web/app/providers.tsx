"use client";

import { ToastProvider } from "@repo/ui/toast";

import { UserProvider } from "../lib/UserContext";

/**
 * Performs  providers operation.
 * @param {{ children: React.ReactNode; }} { children } - Description of { children }
 * @returns {React.JSX.Element} Description of return value
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <UserProvider>{children}</UserProvider>
    </ToastProvider>
  );
}
