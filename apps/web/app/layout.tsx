"use client";

import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "../components/AppShell";

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