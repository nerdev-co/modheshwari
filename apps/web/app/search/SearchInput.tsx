"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, X, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@repo/ui/button";
import { formatBloodGroup } from "@modheshwari/utils/format";

import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { API_BASE } from "../../lib/config";

interface SearchResult {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  profile?: {
    gotra?: string;
    profession?: string;
    bloodGroup?: string;
    location?: string;
  };
  families?: Array<{ name?: string }>;

  [key: string]: unknown;
}

type FilterMode = "text" | "gotra" | "profession" | "location" | "blood" | "role";

export default function SearchInput({
  placeholder = "Search...",
  focusSignal,
}: {
  placeholder?: string;
  focusSignal?: number;
}) {
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);
  const [filterMode, setFilterMode] = useState<FilterMode>("text");
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cacheRef = useRef<Map<string, SearchResult[]>>(new Map());

  const base = API_BASE.replace(/\/$/, "") + "/search";

  const buildQuery = (input: string, mode: FilterMode): string => {
    if (!input.trim()) return "";
    switch (mode) {
      case "gotra":
        return `gotra:${input}`;
      case "profession":
        return `profession:${input}`;
      case "location":
        return `location:${input}`;
      case "blood":
        return `blood:${input}`;
      case "role":
        return `role:${input}`;
      default:
        return input;
    }
  };

  useEffect(() => {
    if (focusSignal !== undefined) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focusSignal]);

  useEffect(() => {
    const raw = (debouncedQ || "").trim();
    if (raw.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const query = buildQuery(raw, filterMode).toLowerCase();

    const cached = cacheRef.current.get(query);
    if (cached) {
      setResults(cached);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`${base}?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Search failed");
        const body = await res.json();
        const items: SearchResult[] = body?.data?.data || [];
        cacheRef.current.set(query, items);
        setResults(items);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Search error", err);
      })
      .finally(() => setLoading(false));

    return () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = null;
    };
  }, [debouncedQ, filterMode, base]);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "COMMUNITY_HEAD":
        return "bg-jewel-gold";
      case "COMMUNITY_SUBHEAD":
        return "bg-jewel-600";
      case "GOTRA_HEAD":
        return "bg-jewel-emerald";
      case "FAMILY_HEAD":
        return "bg-jewel-500";
      default:
        return "bg-jewel-400";
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return "Member";
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="w-full relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-16 py-4 rounded-xl border border-jewel-400/30 bg-jewel-50/50 backdrop-blur-xl text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent shadow-sm transition-all"
          aria-label="Search"
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 transition-colors rounded-lg ${
              showFilters
                ? "text-jewel-gold bg-jewel-gold/10"
                : "text-jewel-400 hover:text-jewel-600"
            }`}
            title="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </Button>
          {loading ? (
            <Loader2 className="w-4 h-4 text-jewel-gold animate-spin" />
          ) : q ? (
            <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="text-jewel-400 hover:text-jewel-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 flex flex-wrap gap-2 p-3 bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 rounded-xl shadow-lg z-40"
          >
            {(["text", "gotra", "profession", "location", "blood", "role"] as FilterMode[]).map((mode) => (
              <Button
                key={mode}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilterMode(mode);
                  setQ("");
                  inputRef.current?.focus();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterMode === mode
                    ? "bg-jewel-gold/15 text-jewel-gold border border-jewel-gold/25"
                    : "bg-jewel-50/70 text-jewel-500 border border-jewel-400/20 hover:bg-jewel-100"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(debouncedQ.length >= 2 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-jewel-50/80 backdrop-blur-2xl rounded-xl border border-jewel-400/20 shadow-jewel overflow-hidden z-50"
          >
            {loading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-jewel-200/70" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-jewel-200/70 rounded" />
                      <div className="h-3 w-1/2 bg-jewel-200/50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && results.length === 0 && debouncedQ && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-jewel-100/80 mb-3">
                  <Search className="w-5 h-5 text-jewel-400" />
                </div>
                <p className="text-sm text-jewel-500">
                  No results found for{" "}
                  <span className="text-jewel-700 font-medium">&ldquo;{debouncedQ}&rdquo;</span>
                </p>
                <p className="text-xs text-jewel-400 mt-1">Try searching with a different keyword</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs text-jewel-400 font-medium">
                    {results.length} {results.length === 1 ? "result" : "results"} found
                  </p>
                </div>

                <ul className="divide-y divide-jewel-400/15">
                  {results.map((r) => (
                    <motion.li
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group"
                    >
                      <Button
                        variant="ghost"
                        className="w-full px-4 py-3 hover:bg-jewel-100/60 transition-all duration-150 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex items-center justify-center w-11 h-11 rounded-xl ${getRoleBadgeColor(r.role)} text-jewel-deep font-bold shadow-sm flex-shrink-0`}
                          >
                            {r.name?.charAt(0).toUpperCase() || "?"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <p className="text-sm font-semibold text-jewel-900 truncate">
                                {r.name || "Unknown"}
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${getRoleBadgeColor(r.role)} text-jewel-deep shadow-sm`}
                              >
                                {formatRole(r.role)}
                              </span>
                            </div>

                            <p className="text-xs text-jewel-400 truncate mb-2">
                              {r.email || "No email"}
                            </p>

                            <div className="flex flex-wrap gap-1.5 text-xs">
                              {r.profile?.gotra && (
                                <span className="px-2 py-0.5 bg-jewel-400/10 text-jewel-600 rounded-md border border-jewel-400/20">
                                  Gotra: {r.profile.gotra}
                                </span>
                              )}
                              {r.profile?.profession && (
                                <span className="px-2 py-0.5 bg-jewel-emerald/10 text-jewel-emerald rounded-md border border-jewel-emerald/20">
                                  {r.profile.profession}
                                </span>
                              )}
                              {r.profile?.location && (
                                <span className="px-2 py-0.5 bg-jewel-gold/10 text-jewel-gold rounded-md border border-jewel-gold/20">
                                  {r.profile.location}
                                </span>
                              )}
                              {r.profile?.bloodGroup && (
                                <span className="px-2 py-0.5 bg-jewel-ruby/10 text-jewel-ruby rounded-md border border-jewel-ruby/20">
                                  {formatBloodGroup(r.profile.bloodGroup)}
                                </span>
                              )}
                            </div>

                            {r.families && r.families.length > 0 && (
                              <p className="text-xs text-jewel-600 mt-1.5">
                                Family: {r.families.map((f) => f.name).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </Button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
