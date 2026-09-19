"use client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";
import { Link } from "react-router-dom";

import { useLocale } from "../lib/LocaleContext";
import { useUser } from "../lib/UserContext";

export default function Home() {
    const navigate = useNavigate();
    const { t } = useLocale();
    const { user } = useUser();

    const firstName = user?.name?.split(" ")[0] || "";

    const upcomingEvents = [
        {
            name: "Ganesh Chaturthi",
            day: "20",
            month: "SEP",
            weekday: "Saturday",
            time: "6:00 PM",
            type: "community",
        },
        {
            name: "Family Gathering",
            day: "22",
            month: "SEP",
            weekday: "Monday",
            time: "11:00 AM",
            type: "family",
        },
        {
            name: "Community Dinner",
            day: "25",
            month: "SEP",
            weekday: "Thursday",
            time: "7:00 PM",
            type: "community",
        },
    ];

    const recentActivity = [
        { action: "Rajesh added a family member", time: "12 minutes ago" },
        { action: "Event registration approved", time: "32 minutes ago" },
        { action: "New resource request", time: "1 hour ago" },
        { action: "New community announcement", time: "2 hours ago" },
    ];

    const familyInfo = user?.families?.[0]
        ? { name: user.families[0].family.name, members: 4, events: 1 }
        : null;

    const stats = [
        { value: "2,048", label: "Members" },
        { value: "526", label: "Families" },
        { value: "52", label: "Gotras" },
    ];

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
                {upcomingEvents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }}
                    className="mb-14"
                >
                    <Link
                        to="/events"
                        className="block border border-border p-8 hover:border-ink-muted transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-6">
                                <div className="text-center flex-shrink-0">
                                    <p className="font-display text-[32px] font-semibold leading-none text-ink">
                                        {upcomingEvents[0]!.day}
                                    </p>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-saffron mt-1">
                                        {upcomingEvents[0]!.month}
                                    </p>
                                </div>
                                <div className="pt-1">
                                    <h2 className="font-display text-[20px] font-semibold text-ink">
                                        {upcomingEvents[0]!.name}
                                    </h2>
                                    <p className="text-[14px] text-ink-secondary mt-1">
                                        {upcomingEvents[0]!.weekday} · {upcomingEvents[0]!.time}
                                    </p>
                                    <p className="text-[13px] text-ink-muted mt-1 capitalize">
                                        {upcomingEvents[0]!.type === "community"
                                            ? t("dashboard.eventType.community")
                                            : t("dashboard.eventType.family")}{" "}
                                        event
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1 mt-1">
                                {t("dashboard.view")}
                                <ArrowRight className="h-3 w-3" />
                            </span>
                        </div>
                    </Link>
                </motion.div>
                )}

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
                            {upcomingEvents.slice(1).map((event) => (
                                <div
                                    key={event.name}
                                    className="flex items-start gap-5 py-4 border-b border-border-subtle last:border-0"
                                >
                                    <div className="text-center flex-shrink-0 w-10">
                                        <p className="font-display text-[18px] font-semibold leading-none text-ink">
                                            {event.day}
                                        </p>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mt-0.5">
                                            {event.month}
                                        </p>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <p className="text-[14px] font-medium text-ink truncate">
                                            {event.name}
                                        </p>
                                        <p className="text-[13px] text-ink-secondary mt-0.5">
                                            {event.weekday} · {event.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {upcomingEvents.length === 0 && (
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
                            {recentActivity.map((activity, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-4 py-3 border-b border-border-subtle last:border-0"
                                >
                                    <div className="mt-1.5 flex-shrink-0">
                                        <div className="h-1.5 w-1.5 rounded-full bg-saffron" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[14px] text-ink">
                                            {activity.action}
                                        </p>
                                        <p className="text-[12px] text-ink-muted mt-0.5">
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                </div>

                <div className="h-px bg-border" />

                {/* ─── Community Stats ─── */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.2 }}
                    className="py-10"
                >
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-6">
                        Community
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
                                        {familyInfo.members} members · {familyInfo.events} events
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
