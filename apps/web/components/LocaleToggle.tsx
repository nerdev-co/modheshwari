"use client";

import { useLocale } from "../lib/LocaleContext";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "hi" : "en")}
      aria-label={locale === "en" ? "हिंदी में बदलें" : "Switch to English"}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-all duration-fast active:scale-[0.95]"
    >
      {locale === "en" ? "हि" : "En"}
    </button>
  );
}
