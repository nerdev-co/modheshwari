"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { LoadingState } from "@repo/ui/loadingState";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import SearchInput from "./SearchInput";
import { useUser } from "../../lib/UserContext";
import { useLocale } from "../../lib/LocaleContext";

/**
 * Performs  search page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SearchPage() {
  const { user, loading } = useUser();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/signin");
  }, [user, loading, navigate]);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFocusTrigger((n) => n + 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center">
      <LoadingState message={t("common.loading")} />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION_PAGE_ENTER}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-saffron/15 border border-saffron/25 mb-6">
            <Search className="w-8 h-8 text-saffron" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold text-ink mb-4">
            {t("search.title")}
          </h1>

          <p className="text-ink-muted text-lg">
            {t("search.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_PAGE_ENTER, delay: 0.2 }}
          className="bg-surface backdrop-blur-2xl rounded-xl p-8 border border-border"
        >
          <div className="relative mb-6">
            <SearchInput
              placeholder={t("search.placeholder")}
              focusSignal={focusTrigger}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            <span>{t("search.quickSearch")}</span>
            <kbd className="px-2 py-1 bg-surface border border-border rounded text-xs font-mono text-ink-muted shadow-sm">
              {isMac ? "\u2318" : "Ctrl"}
            </kbd>
            <span className="text-ink-muted">+</span>
            <kbd className="px-2 py-1 bg-surface border border-border rounded text-xs font-mono text-ink-muted shadow-sm">
              K
            </kbd>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_PAGE_ENTER, delay: 0.6 }}
          className="mt-8"
        >
          <p className="text-sm text-ink-muted mb-3">{t("search.advancedFilters")}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-ink-muted">
            {[
              { label: t("search.byGotra"), desc: t("search.filterByGotra") },
              { label: t("search.byProfession"), desc: t("search.filterByProfession") },
              { label: t("search.byLocation"), desc: t("search.filterByLocation") },
              { label: t("search.byBloodGroup"), desc: t("search.filterByBloodGroup") },
              { label: t("search.byRole"), desc: t("search.filterByRole") },
              { label: t("search.textSearch"), desc: t("search.filterByText") },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="p-3 bg-surface backdrop-blur-md border border-border rounded-xl shadow-sm hover:bg-surface transition-all duration-200 cursor-default"
              >
                <span className="font-semibold text-ink-secondary">{label}</span>
                <p className="text-ink-muted text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...MOTION_PAGE_ENTER, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-ink-muted">
            {t("search.tip")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
