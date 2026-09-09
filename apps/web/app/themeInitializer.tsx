"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const root = document.documentElement;
    
    root.classList.remove("light", "dark");
    
    if (saved === "dark") {
      root.classList.add("dark");
    } else if (saved === "light") {
      root.classList.add("light");
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    }
  }, []);

  return null;
}
