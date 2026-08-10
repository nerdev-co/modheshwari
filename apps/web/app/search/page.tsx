"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";

import SearchInput from "./SearchInput";

/**
 * Performs  search page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SearchPage() {
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [isMac, setIsMac] = useState(false);

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

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-jewel-gold/15 border border-jewel-gold/25 mb-6">
            <Search className="w-8 h-8 text-jewel-gold" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold text-jewel-900 mb-4">
            Search Members
          </h1>

          <p className="text-jewel-500 text-lg">
            Find family members, check profiles, and connect instantly
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-jewel-50/80 backdrop-blur-2xl rounded-2xl p-8 border border-jewel-400/20 shadow-jewel"
        >
          <div className="relative mb-6">
            <SearchInput
              placeholder="Search by name, email, family, occupation or blood group..."
              focusSignal={focusTrigger}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-jewel-400">
            <span>Quick search:</span>
            <kbd className="px-2 py-1 bg-jewel-50/50 border border-jewel-400/30 rounded text-xs font-mono text-jewel-500 shadow-sm">
              {isMac ? "\u2318" : "Ctrl"}
            </kbd>
            <span className="text-jewel-300">+</span>
            <kbd className="px-2 py-1 bg-jewel-50/50 border border-jewel-400/30 rounded text-xs font-mono text-jewel-500 shadow-sm">
              K
            </kbd>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <p className="text-sm text-jewel-400 mb-3">Advanced Filters:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-jewel-500">
            {[
              { label: "By Gotra", desc: "Filter by gotra/clan" },
              { label: "By Profession", desc: "Find by occupation" },
              { label: "By Location", desc: "Search by area/city" },
              { label: "By Blood Group", desc: "Filter by blood type" },
              { label: "By Role", desc: "Find by member role" },
              { label: "Text Search", desc: "Multi-field search" },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="p-3 bg-jewel-50/60 backdrop-blur-md border border-jewel-400/20 rounded-xl shadow-sm hover:bg-jewel-100/60 transition-all duration-200 cursor-default"
              >
                <span className="font-semibold text-jewel-700">{label}</span>
                <p className="text-jewel-400 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-jewel-400">
            Tip: Use specific keywords for better results. Contact support if
            you can&apos;t find someone.
          </p>
        </motion.div>
      </div>
    </DreamySunsetBackground>
  );
}
