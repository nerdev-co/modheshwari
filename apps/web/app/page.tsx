"use client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";
import { Link } from "react-router-dom";

import { useLocale } from "../lib/LocaleContext";
import { useUser } from "../lib/UserContext";
import { apiFetch } from "../lib/api";
import { API_BASE } from "../lib/config";

type EventItem = {
    id: string;
    name: string;
    date: string;
    venue?: string;
    status: string;
};

export default function Home() {
    const navigate = useNavigate();
    const { t } = useLocale();
    const { user } = useUser();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [stats, setStats] = useState<{ value: string; label: string }[]>([]);

    const firstName = user?.name?.split(" ")[0] || "";

    const fetchEvents = useCallback(async () => {
        try {
            const res = await apiFetch(`${API_BASE}/events?status=APPROVED&limit=10`, { throwOnError: false });
            const items = res?.data?.data || res?.data || [];
            setEvents(Array.isArray(items) ? items : []);
        } catch {
            setEvents([]);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiFetch(`${API_BASE}/search?q=&limit=1`, { throwOnError: false });
            const total = res?.data?.total || res?.total || 0;
            if (total > 0) {
                setStats([
                    { value: total.toLocaleString(), label: t("dashboard.statsMembers") },
                ]);
            }
        } catch {
            // stats optional
        }
    }, [t]);

    useEffect(() => {
        fetchEvents();
        fetchStats();
    }, [fetchEvents, fetchStats]);

    const formatEventDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return {
            day: d.getDate().toString(),
            month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
            weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
            time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        };
    };

    const familyInfo = user?.families?.[0]
        ? { name: user.families[0].family.name }
        : null;

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">

                {/* ─── Welcome ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="mb-14"
                >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-3">
                        {t("dashboard.greeting")}
                    </p>
                    {firstName && (
                        <h1 className="font-display text-[40px] font-semibold leading-tight text-ink mb-2">
                            {firstName}
                        </h1>
                    )}
                    <p className="text-[16px] text-ink-secondary">
                        {t("dashboard.subtitle")}
                    </p>
                </motion.div>

                {/* ─── Featured Event ─── */}
                {events.length > 0 && (() => {
                    const feat = events[0]!;
                    const fd = formatEventDate(feat.date);
                    return (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }}
                        className="mb-14"
                    >
                        <Link
                            to={`/events/${feat.id}`}
                            className="block border border-border p-8 hover:border-ink-muted transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-6">
                                    <div className="text-center flex-shrink-0">
                                        <p className="font-display text-[32px] font-semibold leading-none text-ink">
                                            {fd.day}
                                        </p>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-saffron mt-1">
                                            {fd.month}
                                        </p>
                                    </div>
                                    <div className="pt-1">
                                        <h2 className="font-display text-[20px] font-semibold text-ink">
                                            {feat.name}
                                        </h2>
                                        <p className="text-[14px] text-ink-secondary mt-1">
                                            {fd.weekday} · {fd.time}
                                        </p>
                                        {feat.venue && (
                                            <p className="text-[13px] text-ink-muted mt-1">
                                                {feat.venue}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1 mt-1">
                                    {t("dashboard.view")}
                                    <ArrowRight className="h-3 w-3" />
                                </span>
                            </div>
                        </Link>
                    </motion.div>
                    );
                })()}

                {/* ─── Two Column: Upcoming + Activity ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">

                    {/* Upcoming Events */}
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                {t("dashboard.upcoming")}
                            </h2>
                            <button
                                onClick={() => navigate("/events")}
                                className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
                            >
                                {t("dashboard.viewAll")}
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>

                        <div className="space-y-0">
                            {events.slice(1).map((event) => {
                                const ed = formatEventDate(event.date);
                                return (
                                <div
                                    key={event.id}
                                    onClick={() => navigate(`/events/${event.id}`)}
                                    className="flex items-start gap-5 py-4 border-b border-border-subtle last:border-0 cursor-pointer hover:bg-surface transition-colors -mx-2 px-2"
                                >
                                    <div className="text-center flex-shrink-0 w-10">
                                        <p className="font-display text-[18px] font-semibold leading-none text-ink">
                                            {ed.day}
                                        </p>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mt-0.5">
                                            {ed.month}
                                        </p>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <p className="text-[14px] font-medium text-ink truncate">
                                            {event.name}
                                        </p>
                                        <p className="text-[13px] text-ink-secondary mt-0.5">
                                            {ed.weekday} · {ed.time}
                                        </p>
                                    </div>
                                </div>
                                );
                            })}
                        </div>

                        {events.length === 0 && (
                            <p className="text-[14px] text-ink-muted py-4">
                                {t("dashboard.noUpcomingEvents")}
                            </p>
                        )}
                    </motion.section>

                    {/* Recent Activity */}
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.15 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                {t("dashboard.recentActivity")}
                            </h2>
                            <button
                                onClick={() => navigate("/activity")}
                                className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
                            >
                                {t("dashboard.viewAll")}
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>

                        <div className="space-y-0">
                            <div className="text-center py-8">
                                <p className="text-[14px] text-ink-muted">
                                    {t("dashboard.noActivityYet")}
                                </p>
                            </div>
                        </div>
                    </motion.section>
                </div>

                <div className="h-px bg-border" />

                {/* ─── Community Stats ─── */}
                {stats.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.2 }}
                    className="py-10"
                >
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-6">
                        {t("dashboard.community")}
                    </h2>
                    <div className="grid grid-cols-3 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <p className="font-display text-[28px] font-semibold text-ink leading-none">
                                    {stat.value}
                                </p>
                                <p className="text-[13px] text-ink-muted mt-1">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.section>
                )}

                {/* ─── Family Info ─── */}
                {familyInfo && (
                    <>
                        <div className="h-px bg-border" />
                        <motion.section
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...MOTION_PAGE_ENTER, delay: 0.25 }}
                            className="py-10"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">
                                        {t("dashboard.yourFamily")}
                                    </h2>
                                    <p className="text-[18px] font-semibold text-ink">
                                        {familyInfo.name}
                                    </p>
                                    <p className="text-[13px] text-ink-muted mt-1">
                                        {t("dashboard.yourFamily")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate("/family")}
                                    className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
                                >
                                    {t("dashboard.view")}
                                    <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>
                        </motion.section>
                    </>
                )}

            </div>
        </div>
    );
}
