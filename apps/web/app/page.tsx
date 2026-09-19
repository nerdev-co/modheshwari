"use client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import {
    Users,
    Shield,
    Heart,
    Bell,
    Calendar,
    ArrowRight,
    Sparkles,
    TrendingUp,
    Home as HomeIcon,
    BookOpen,
    Archive,
} from "lucide-react";
import {
    MOTION_ENTER,
    MOTION_PAGE_ENTER,
    STAGGER_CONTAINER,
    STAGGER_ITEM,
} from "@repo/ui/motion";

import { useLocale } from "../lib/LocaleContext";
import { useUser } from "../lib/UserContext";

export default function Home() {
    const navigate = useNavigate();
    const { t, locale } = useLocale();
    const { user } = useUser();

    const greeting = user?.name
        ? `${t("dashboard.greeting")}, ${user.name.split(" ")[0]}.`
        : t("dashboard.greetingAnonymous");

    const stats = [
        {
            value: "2,048",
            labelKey: "dashboard.members",
            change: "+38 this month",
            icon: Users,
            color: "text-saffron",
        },
        {
            value: "526",
            labelKey: "dashboard.families",
            change: "+6 this month",
            icon: HomeIcon,
            color: "text-emerald",
        },
        {
            value: "52",
            labelKey: "dashboard.gotras",
            change: "across community",
            icon: BookOpen,
            color: "text-ink-muted",
        },
    ];

    const upcomingEvents = [
        {
            name: "Ganesh Chaturthi",
            date: "Sep 20",
            time: "6:00 PM",
            type: "community",
        },
        {
            name: "Family Gathering",
            date: "Sep 22",
            time: "11:00 AM",
            type: "family",
        },
    ];

    const recentActivity = [
        { action: "Rajesh added a family member", time: "12m", type: "member" },
        { action: "Event registration approved", time: "32m", type: "event" },
        { action: "New resource request", time: "1h", type: "resource" },
        {
            action: "New community announcement",
            time: "2h",
            type: "announcement",
        },
    ];

    const familyInfo = user?.families?.[0]
        ? { name: user.families[0].family.name, members: 4, events: 1 }
        : null;

    return (
        <div className="bg-canvas relative min-h-screen">
            <main className="relative z-10">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={MOTION_PAGE_ENTER}
                        className="mb-10"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-heading text-ink font-display-bold">
                                    {greeting}
                                </p>
                                <p className="text-body text-ink-secondary mt-1">
                                    {t("dashboard.subtitle")}
                                </p>
                            </div>
                            {user && (
                                <Button
                                    onClick={() => navigate("/events/create")}
                                    size="sm"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {t("dashboard.createEvent")}
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    {/* Community Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                        className="mb-10"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
                            {stats.map((stat, idx) => (
                                <motion.div
                                    key={stat.labelKey}
                                    variants={STAGGER_ITEM}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: idx * 0.08,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    <div className="bg-surface-raised border-border rounded-xl border p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-caption text-ink-muted mb-2 font-medium tracking-wide uppercase">
                                                    {t(stat.labelKey)}
                                                </p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-display-xl text-ink text-numbers font-display-bold">
                                                        {stat.value}
                                                    </span>
                                                    <span className="text-ink-muted self-end text-sm">
                                                        {stat.change}
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                className={`inline-flex p-3 rounded-xl bg-surface-muted ${stat.color}`}
                                            >
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.2 }}
                        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
                    >
                        {/* Upcoming Events */}
                        <motion.div className="space-y-6 lg:col-span-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-heading-md text-ink font-display-bold">
                                    {t("dashboard.upcoming")}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate("/events")}
                                >
                                    {t("dashboard.viewAll")}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {upcomingEvents.length > 0 ? (
                                <div
                                    className="space-y-3"
                                    role="list"
                                    aria-label="Upcoming events"
                                >
                                    {upcomingEvents.map((event, idx) => (
                                        <motion.div
                                            key={event.name}
                                            variants={STAGGER_ITEM}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: idx * 0.06,
                                                ease: [0.16, 1, 0.3, 1],
                                            }}
                                        >
                                            <div className="bg-surface-raised border-border hover:bg-surface-muted rounded-xl border p-4 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-saffron-soft flex h-12 w-12 items-center justify-center rounded-xl">
                                                        <Calendar className="text-saffron h-6 w-6" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-body text-ink truncate font-semibold">
                                                            {event.name}
                                                        </p>
                                                        <p className="text-ink-secondary flex items-center gap-2 text-sm">
                                                            <span>
                                                                {event.date}
                                                            </span>
                                                            <span className="text-ink-muted">
                                                                ·
                                                            </span>
                                                            <span>
                                                                {event.time}
                                                            </span>
                                                            <span className="text-ink-muted">
                                                                ·
                                                            </span>
                                                            <Badge
                                                                variant={
                                                                    event.type ===
                                                                    "community"
                                                                        ? "gold"
                                                                        : "emerald"
                                                                }
                                                                size="xs"
                                                            >
                                                                {t(
                                                                    `dashboard.eventType.${event.type}`,
                                                                )}
                                                            </Badge>
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-ink-secondary hover:text-saffron"
                                                    >
                                                        {t("dashboard.view")}
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-surface-raised border-border rounded-xl border p-8 text-center">
                                    <Calendar className="text-ink-muted mx-auto mb-3 h-12 w-12" />
                                    <p className="text-body text-ink-secondary">
                                        {t("dashboard.noUpcomingEvents")}
                                    </p>
                                    <Button
                                        onClick={() =>
                                            navigate("/events/create")
                                        }
                                        className="mt-4"
                                    >
                                        {t("dashboard.createEvent")}
                                    </Button>
                                </div>
                            )}

                            {/* Your Community / Family */}
                            {familyInfo && (
                                <motion.div
                                    variants={STAGGER_ITEM}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: 0.3,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    <div className="bg-surface-raised border-border rounded-xl border p-6">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-soft flex h-12 w-12 items-center justify-center rounded-xl">
                                                    <Users className="text-emerald h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-heading text-ink font-display-bold">
                                                        {familyInfo.name}
                                                    </p>
                                                    <p className="text-ink-muted text-sm">
                                                        {t(
                                                            "dashboard.yourFamily",
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    navigate("/family")
                                                }
                                            >
                                                {t("dashboard.viewFamily")}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div className="bg-surface-muted rounded-lg p-3">
                                                <p className="text-display text-ink text-numbers font-display-bold">
                                                    {familyInfo.members}
                                                </p>
                                                <p className="text-caption text-ink-muted">
                                                    {t("dashboard.members")}
                                                </p>
                                            </div>
                                            <div className="bg-surface-muted rounded-lg p-3">
                                                <p className="text-display text-ink text-numbers font-display-bold">
                                                    {familyInfo.events}
                                                </p>
                                                <p className="text-caption text-ink-muted">
                                                    {t(
                                                        "dashboard.upcomingEvents",
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div
                            variants={STAGGER_ITEM}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.4,
                                delay: 0.4,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        >
                            <div className="bg-surface-raised border-border rounded-xl border">
                                <div className="border-border flex items-center justify-between border-b p-4">
                                    <h3 className="text-heading-sm text-ink font-display-bold">
                                        {t("dashboard.recentActivity")}
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/activity")}
                                    >
                                        {t("dashboard.viewAll")}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="divide-border divide-y">
                                    {recentActivity.map((activity, idx) => (
                                        <motion.div
                                            key={activity.action}
                                            variants={STAGGER_ITEM}
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                duration: 0.2,
                                                delay: idx * 0.04,
                                                ease: [0.16, 1, 0.3, 1],
                                            }}
                                        >
                                            <div className="hover:bg-surface-muted flex items-center gap-3 p-4 transition-colors">
                                                <div className="bg-saffron h-2 w-2 flex-shrink-0 rounded-full" />
                                                <p className="text-ink min-w-0 flex-1 truncate text-sm">
                                                    {activity.action}
                                                </p>
                                                <span className="text-caption text-ink-muted flex-shrink-0">
                                                    {activity.time}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.5 }}
                        className="mt-10"
                    >
                        <div className="bg-surface-raised border-border rounded-xl border p-8 text-center">
                            <div className="bg-saffron mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
                                <Sparkles className="text-ink-on-accent h-7 w-7" />
                            </div>
                            <h2 className="text-heading-lg text-ink mb-3 font-display-bold">
                                {t("dashboard.ctaTitle")}
                            </h2>
                            <p className="text-body text-ink-secondary mx-auto mb-6 max-w-md">
                                {t("dashboard.ctaDescription")}
                            </p>
                            <div className="flex flex-col justify-center gap-3 sm:flex-row">
                                <Button
                                    onClick={() => navigate("/families")}
                                    size="lg"
                                >
                                    {t("dashboard.exploreFamilies")}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate("/search")}
                                    size="lg"
                                >
                                    {t("dashboard.searchMembers")}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
