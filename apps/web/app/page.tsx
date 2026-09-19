"use client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/button";
import {
    Users,
    Calendar,
    ArrowRight,
    Sparkles,
    Home as HomeIcon,
    BookOpen,
} from "lucide-react";
import { MOTION_PAGE_ENTER, STAGGER_ITEM } from "@repo/ui/motion";

import { useLocale } from "../lib/LocaleContext";
import { useUser } from "../lib/UserContext";

export default function Home() {
    const navigate = useNavigate();
    const { t } = useLocale();
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
        <div className="bg-canvas min-h-screen">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="mb-10"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-display-bold text-heading-lg text-ink">
                                {greeting}
                            </h1>
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                                <div className="bg-surface-raised border-border rounded-xl border p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-caption text-ink-muted mb-1.5 font-medium tracking-wide uppercase">
                                                {t(stat.labelKey)}
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-display-bold text-display text-ink text-numbers">
                                                    {stat.value}
                                                </span>
                                                <span className="text-caption text-ink-muted">
                                                    {stat.change}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`inline-flex p-2.5 rounded-lg bg-surface-muted ${stat.color}`}>
                                            <stat.icon className="h-5 w-5" />
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
                    <div className="space-y-4 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display-bold text-heading text-ink">
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
                            <div className="space-y-2" role="list" aria-label="Upcoming events">
                                {upcomingEvents.map((event, idx) => (
                                    <motion.div
                                        key={event.name}
                                        variants={STAGGER_ITEM}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: idx * 0.06,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                    >
                                        <div className="bg-surface-raised border-border hover:bg-surface-muted rounded-xl border p-3.5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-saffron-soft flex h-10 w-10 items-center justify-center rounded-lg">
                                                    <Calendar className="text-saffron h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-body text-ink truncate font-medium">
                                                        {event.name}
                                                    </p>
                                                    <p className="text-caption text-ink-secondary flex items-center gap-1.5">
                                                        <span>{event.date}</span>
                                                        <span className="text-ink-muted">·</span>
                                                        <span>{event.time}</span>
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
                                <Calendar className="text-ink-muted mx-auto mb-3 h-10 w-10" />
                                <p className="text-body text-ink-secondary">
                                    {t("dashboard.noUpcomingEvents")}
                                </p>
                                <Button
                                    onClick={() => navigate("/events/create")}
                                    className="mt-4"
                                    size="sm"
                                >
                                    {t("dashboard.createEvent")}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display-bold text-heading text-ink">
                                {t("dashboard.recentActivity")}
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/activity")}
                            >
                                {t("dashboard.viewAll")}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="bg-surface-raised border-border rounded-xl border divide-y divide-border">
                            {recentActivity.map((activity, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={STAGGER_ITEM}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: idx * 0.06,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="px-4 py-3"
                                >
                                    <p className="text-body text-ink">
                                        {activity.action}
                                    </p>
                                    <p className="text-caption text-ink-muted mt-0.5">
                                        {activity.time}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Family Info */}
                {familyInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOTION_PAGE_ENTER, delay: 0.3 }}
                        className="mt-6"
                    >
                        <div className="bg-surface-raised border-border rounded-xl border p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-soft flex h-10 w-10 items-center justify-center rounded-lg">
                                        <Users className="text-emerald h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-display-bold text-body text-ink">
                                            {familyInfo.name}
                                        </p>
                                        <p className="text-caption text-ink-muted">
                                            {familyInfo.members} members · {familyInfo.events} events
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate("/family")}
                                >
                                    {t("dashboard.view")}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
