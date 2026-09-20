"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import en from "../locales/en.json";
import hi from "../locales/hi.json";

type Locale = "en" | "hi";

const translations = { en, hi } as Record<Locale, Record<string, unknown>>;

interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match && match[2] ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`;
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
    let value: unknown = obj;

    for (const key of path.split(".")) {
        if (value === null || typeof value !== "object" || !(key in value)) {
            return path;
        }

        value = (value as Record<string, unknown>)[key];
    }

    return typeof value === "string" ? value : path;
}
function interpolate(
    template: string,
    params?: Record<string, string | number>,
): string {
    if (!params) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
        String(params[key] ?? ""),
    );
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = getCookie("locale");
        if (saved === "en" || saved === "hi") {
            setLocaleState(saved);
        }
        setMounted(true);
    }, []);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        setCookie("locale", newLocale);
        document.documentElement.lang = newLocale;
    }, []);

    const t = useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            const template = getNestedValue(translations[locale], key);
            return interpolate(template, params);
        },
        [locale],
    );

    const ctx = useMemo(
        () => ({ locale, setLocale, t }),
        [locale, setLocale, t],
    );

    if (!mounted) {
        return (
            <LocaleContext.Provider
                value={{
                    locale: "en",
                    setLocale: () => {},
                    t: (k, p) =>
                        interpolate(getNestedValue(translations.en, k), p),
                }}
            >
                {children}
            </LocaleContext.Provider>
        );
    }

    return (
        <LocaleContext.Provider value={ctx}>{children}</LocaleContext.Provider>
    );
}

export function useLocale(): LocaleContextValue {
    const ctx = useContext(LocaleContext);
    if (!ctx)
        throw new Error("useLocale must be used within a <LocaleProvider>");
    return ctx;
}
