"use client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, TreePine, Search, Heart, Users, Shield, Clock } from "lucide-react";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";
import { Link } from "react-router-dom";

import { useLocale } from "../lib/LocaleContext";
import { useUser } from "../lib/UserContext";
import { apiFetch } from "../lib/api";
import { API_BASE } from "../lib/config";
import { SunMark } from "../components/SunMark";

type EventItem = {
    id: string;
    name: string;
    date: string;
    venue?: string;
    status: string;
};

/* ───────────────────────── Landing (logged out) ───────────────────────── */

function LandingPage() {
    const navigate = useNavigate();
    const [memberCount, setMemberCount] = useState<number | null>(null);

    useEffect(() => {
        apiFetch(`${API_BASE}/search?q=&limit=1`, { throwOnError: false })
            .then((res) => {
                const total = res?.data?.total || res?.total || 0;
                if (total > 0) setMemberCount(total);
            })
            .catch(() => {});
    }, []);

    const benefits = [
        {
            icon: Calendar,
            title: "Never miss a gathering",
            desc: "Festivals, reunions, celebrations — every event in one place, with reminders so you're always there.",
        },
        {
            icon: TreePine,
            title: "Know your roots",
            desc: "Explore your family tree, discover your gotra, and preserve your lineage for the next generation.",
        },
        {
            icon: Search,
            title: "Find anyone, fast",
            desc: "Search by name, gotra, blood group, or profession. Reach the right person when it matters.",
        },
        {
            icon: Shield,
            title: "There when it matters",
            desc: "Blood groups, health records, emergency contacts — vital info accessible to your family in seconds.",
        },
    ];

    return (
        <div className="min-h-screen">
            {/* ─── Hero ─── */}
            <div className="mx-auto max-w-[1100px] px-6 pt-24 pb-28 sm:px-8 lg:px-10">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="text-center max-w-2xl mx-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }}
                        className="inline-flex items-center justify-center mb-8"
                    >
                        <SunMark size={56} />
                    </motion.div>

                    <p className="text-caption font-semibold uppercase tracking-wider text-saffron mb-4">
                        Community Platform
                    </p>

                    <h1 className="font-display text-display-lg sm:text-[3.5rem] font-bold leading-[1.1] text-ink mb-5">
                        Your community,{" "}
                        <span className="text-saffron">one place.</span>
                    </h1>

                    <p className="text-body-lg text-ink-secondary max-w-lg mx-auto mb-10">
                        Family trees, events, health records, and conversations — built for communities like yours to stay connected.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => navigate("/signup")}
                            className="inline-flex items-center gap-2 bg-ink text-canvas px-8 py-3.5 text-body font-semibold hover:bg-ink-muted transition-colors"
                        >
                            Join Your Family
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => navigate("/signin")}
                            className="inline-flex items-center gap-2 border border-border px-8 py-3.5 text-body font-semibold text-ink hover:border-ink-muted hover:bg-surface transition-colors"
                        >
                            Sign In
                        </button>
                    </div>

                    {memberCount !== null && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ ...MOTION_PAGE_ENTER, delay: 0.4 }}
                            className="mt-8 text-sm text-ink-muted"
                        >
                            Trusted by{" "}
                            <span className="font-semibold text-ink">
                                {memberCount.toLocaleString()}+
                            </span>{" "}
                            community members
                        </motion.p>
                    )}
                </motion.div>
            </div>

            {/* ─── Problem ─── */}
            <div className="bg-surface">
                <div className="mx-auto max-w-[1100px] px-6 py-20 sm:px-8 lg:px-10">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                        className="max-w-2xl"
                    >
                        <p className="text-caption font-semibold uppercase tracking-wider text-saffron mb-4">
                            The problem
                        </p>
                        <h2 className="font-display text-heading-lg font-semibold text-ink mb-6 leading-snug">
                            Families grow. Cities change.
                            <br />
                            Connections shouldn't fade.
                        </h2>
                        <div className="space-y-4 text-body text-ink-secondary leading-relaxed">
                            <p>
                                Missed a festival because nobody told you. Forgot a cousin's name at the last reunion. Scrambling for a blood group when someone's in the hospital.
                            </p>
                            <p>
                                Communities don't disappear — they just lose their center.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ─── Benefits ─── */}
            <div className="mx-auto max-w-[1100px] px-6 py-24 sm:px-8 lg:px-10">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                    className="mb-14"
                >
                    <p className="text-caption font-semibold uppercase tracking-wider text-saffron mb-3">
                        What you get
                    </p>
                    <h2 className="font-display text-heading-lg font-semibold text-ink">
                        Everything your community needs
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {benefits.map((benefit, i) => (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...MOTION_PAGE_ENTER, delay: 0.15 + i * 0.05 }}
                            className="flex gap-5"
                        >
                            <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-saffron/10 flex-shrink-0 mt-0.5">
                                <benefit.icon className="w-5 h-5 text-saffron" />
                            </div>
                            <div>
                                <h3 className="text-body font-semibold text-ink mb-1.5">
                                    {benefit.title}
                                </h3>
                                <p className="text-sm text-ink-muted leading-relaxed">
                                    {benefit.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ─── How it works ─── */}
            <div className="bg-surface">
                <div className="mx-auto max-w-[1100px] px-6 py-24 sm:px-8 lg:px-10">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                        className="text-center mb-14"
                    >
                        <p className="text-caption font-semibold uppercase tracking-wider text-saffron mb-3">
                            How it works
                        </p>
                        <h2 className="font-display text-heading-lg font-semibold text-ink">
                            Three steps to get started
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-3xl mx-auto">
                        {[
                            {
                                step: "01",
                                title: "Your family head joins",
                                desc: "A family head creates the family and invites members.",
                            },
                            {
                                step: "02",
                                title: "You accept the invite",
                                desc: "Get a link, create your account, and you're in.",
                            },
                            {
                                step: "03",
                                title: "You're connected",
                                desc: "See events, chat with family, access health records — everything in one place.",
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...MOTION_PAGE_ENTER, delay: 0.15 + i * 0.05 }}
                                className="text-center"
                            >
                                <p className="font-display text-heading-md font-bold text-saffron mb-3">
                                    {item.step}
                                </p>
                                <h3 className="text-body font-semibold text-ink mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-ink-muted leading-relaxed">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Social Proof ─── */}
            {memberCount !== null && (
                <>
                    <div className="mx-auto max-w-[1100px] px-6 py-24 sm:px-8 lg:px-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                        >
                            <p className="font-display text-heading-xl font-bold text-ink mb-2">
                                {memberCount.toLocaleString()}+
                            </p>
                            <p className="text-body text-ink-secondary mb-2">
                                Members across the community
                            </p>
                            <p className="text-sm text-ink-muted max-w-md mx-auto">
                                Families already using Modheshwari to stay connected, coordinate events, and look out for each other.
                            </p>
                        </motion.div>
                    </div>
                </>
            )}

            {/* ─── Final CTA ─── */}
            <div className="bg-surface">
                <div className="mx-auto max-w-[1100px] px-6 py-24 sm:px-8 lg:px-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                    >
                        <h2 className="font-display text-heading-lg font-semibold text-ink mb-4">
                            Ready to join your family?
                        </h2>
                        <p className="text-body text-ink-secondary mb-8 max-w-md mx-auto">
                            Your community is already here. All you need is an invite.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => navigate("/signup")}
                                className="inline-flex items-center gap-2 bg-ink text-canvas px-8 py-3.5 text-body font-semibold hover:bg-ink-muted transition-colors"
                            >
                                Join Your Family
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => navigate("/signin")}
                                className="inline-flex items-center gap-2 border border-border px-8 py-3.5 text-body font-semibold text-ink hover:border-ink-muted hover:bg-surface transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ─── Footer ─── */}
            <div className="h-px bg-border mx-auto max-w-[1100px]" />
            <div className="mx-auto max-w-[1100px] px-6 py-8 sm:px-8 lg:px-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <SunMark size={24} />
                        <span className="text-body font-semibold text-ink">
                            Modheshwari
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-ink-muted">
                        <a href="/privacy" className="hover:text-ink transition-colors">
                            Privacy
                        </a>
                        <a href="/terms" className="hover:text-ink transition-colors">
                            Terms
                        </a>
                        <a href="/contact" className="hover:text-ink transition-colors">
                            Contact
                        </a>
                    </div>
                    <p className="text-caption text-ink-muted">
                        &copy; {new Date().getFullYear()} Modheshwari · Built by{" "}
                        <a
                            href="https://nerdev.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-ink transition-colors"
                        >
                            nerdev
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────── Dashboard (logged in) ───────────────────────── */

function Dashboard() {
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
                    <p className="text-caption font-semibold uppercase tracking-wider text-ink-muted mb-3">
                        {t("dashboard.greeting")}
                    </p>
                    {firstName && (
                        <h1 className="font-display text-display-lg font-semibold leading-tight text-ink mb-2">
                            {firstName}
                        </h1>
                    )}
                    <p className="text-body-lg text-ink-secondary">
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
                                        <p className="font-display text-heading-lg font-semibold leading-none text-ink">
                                            {fd.day}
                                        </p>
                                        <p className="text-caption font-semibold uppercase tracking-wider text-saffron mt-1">
                                            {fd.month}
                                        </p>
                                    </div>
                                    <div className="pt-1">
                                        <h2 className="font-display text-heading font-semibold text-ink">
                                            {feat.name}
                                        </h2>
                                        <p className="text-body text-ink-secondary mt-1">
                                            {fd.weekday} · {fd.time}
                                        </p>
                                        {feat.venue && (
                                            <p className="text-body text-ink-muted mt-1">
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
                            <h2 className="text-caption font-semibold uppercase tracking-wider text-ink-muted">
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
                                        <p className="font-display text-heading-sm font-semibold leading-none text-ink">
                                            {ed.day}
                                        </p>
                                        <p className="text-caption font-semibold uppercase tracking-wider text-ink-muted mt-0.5">
                                            {ed.month}
                                        </p>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <p className="text-body font-medium text-ink truncate">
                                            {event.name}
                                        </p>
                                        <p className="text-body text-ink-secondary mt-0.5">
                                            {ed.weekday} · {ed.time}
                                        </p>
                                    </div>
                                </div>
                                );
                            })}
                        </div>

                        {events.length === 0 && (
                            <p className="text-body text-ink-muted py-4">
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
                            <h2 className="text-caption font-semibold uppercase tracking-wider text-ink-muted">
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
                                <p className="text-body text-ink-muted">
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
                    <h2 className="text-caption font-semibold uppercase tracking-wider text-ink-muted mb-6">
                        {t("dashboard.community")}
                    </h2>
                    <div className="grid grid-cols-3 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <p className="font-display text-heading-md font-semibold text-ink leading-none">
                                    {stat.value}
                                </p>
                                <p className="text-body text-ink-muted mt-1">
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
                                    <h2 className="text-caption font-semibold uppercase tracking-wider text-ink-muted mb-2">
                                        {t("dashboard.yourFamily")}
                                    </h2>
                                    <p className="text-heading-sm font-semibold text-ink">
                                        {familyInfo.name}
                                    </p>
                                    <p className="text-body text-ink-muted mt-1">
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

/* ───────────────────────── Router ───────────────────────── */

export default function Home() {
    const { user, loading } = useUser();

    if (loading) return null;
    if (!user) return <LandingPage />;
    return <Dashboard />;
}
