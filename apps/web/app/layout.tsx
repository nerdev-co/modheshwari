"use client";

import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "../components/AppShell";

/**
 * Performs  root layout operation.
 * @param {{ children: React.ReactNode; }} {
 *   children,
 * } - Description of {
 *   children,
 * }
 * @returns {React.JSX.Element} Description of return value
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}