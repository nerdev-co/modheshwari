"use client";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { Button } from "@repo/ui/button";
import { formatBloodGroup } from "@modheshwari/utils/format";
import {
    Mail,
    Phone,
    MapPin,
    Briefcase,
    BookOpen,
    Droplet,
    Calendar,
    Users,
    ChevronRight,
    Activity,
    ArrowRight,
} from "lucide-react";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import { useUser } from "../../lib/UserContext";
import { useLocale } from "../../lib/LocaleContext";

export default function MePage() {
    const navigate = useNavigate();
    const { user, loading } = useUser();
    const { t } = useLocale();

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoaderOne />
            </div>
        );
    }

    if (!user) {
        navigate("/signin");
        return null;
    }

    const initials = (user.name || "")
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
          })
        : "2026";

    const hasFamily = Array.isArray(user.families) && user.families.length > 0;

    const getAvatarColor = () => {
        const colors: Record<string, string> = {
            COMMUNITY_HEAD: "#c97c1c",
            COMMUNITY_SUBHEAD: "#4a3228",
            GOTRA_HEAD: "#1b5e20",
            FAMILY_HEAD: "#5c4033",
            MEMBER: "#8b7355",
        };
        return colors[user.role] || "#8b7355";
    };

    const personalFields = [
        {
            label: t("profile.bloodGroup"),
            value: formatBloodGroup(user.profile?.bloodGroup),
        },
        {
            label: t("profile.gotra"),
            value: user.profile?.gotra,
        },
        {
            label: t("profile.profession"),
            value: user.profile?.profession,
        },
    ];

    const contactFields = [
        {
            label: t("profile.email"),
            value: user.email,
        },
        {
            label: t("profile.phone"),
            value: user.profile?.phone,
        },
        {
            label: t("profile.location"),
            value: user.profile?.location,
        },
    ];

    const roleDisplay = user.role?.toLowerCase().replace(/_/g, " ") || "member";

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">

                {/* ─── Profile Header ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="mb-14"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-6">
                            <div
                                className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white"
                                style={{ backgroundColor: getAvatarColor() }}
                            >
                                {initials}
                            </div>
                            <div className="pt-2">
                                <h1 className="font-display text-[36px] font-semibold leading-tight text-ink">
                                    {user.name || t("profile.unnamedMember")}
                                </h1>
                                <p className="text-[15px] text-ink-secondary mt-1">
                                    Member of the Modheshwari community
                                </p>
                                <div className="flex items-center gap-2 mt-3 text-sm text-ink-muted">
                                    <span className="capitalize">{roleDisplay}</span>
                                    <span className="text-border-strong">·</span>
                                    <span>{t("profile.active")}</span>
                                    <span className="text-border-strong">·</span>
                                    <span>Joined {memberSince}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate("/me/edit")}
                            className="mt-2"
                        >
                            {t("profile.editProfile")}
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </div>
                </motion.div>

                <div className="h-px bg-border" />

                {/* ─── About Section ─── */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }}
                    className="py-10"
                >
                    <div className="mb-8">
                        <h2 className="text-[18px] font-semibold text-ink">
                            {t("profile.about")}
                        </h2>
                        <p className="text-sm text-ink-muted mt-1">
                            A few things about you
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Personal Column */}
                        <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-4">
                                Personal
                            </h3>
                            <div className="h-px bg-border-subtle mb-4" />
                            <div className="space-y-4">
                                {personalFields.map((field) => (
                                    <div key={field.label} className="flex items-baseline justify-between">
                                        <span className="text-sm text-ink-muted">{field.label}</span>
                                        <span className="text-sm font-medium text-ink">{field.value || "—"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Column */}
                        <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-4">
                                Contact
                            </h3>
                            <div className="h-px bg-border-subtle mb-4" />
                            <div className="space-y-4">
                                {contactFields.map((field) => (
                                    <div key={field.label} className="flex items-baseline justify-between">
                                        <span className="text-sm text-ink-muted">{field.label}</span>
                                        <span className="text-sm font-medium text-ink">{field.value || "—"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={() => navigate("/me/edit")}
                            className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
                        >
                            {t("common.edit")}
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </motion.section>

                <div className="h-px bg-border" />

                {/* ─── Family Section ─── */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                    className="py-10"
                >
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-[18px] font-semibold text-ink">
                                {t("profile.yourFamily")}
                            </h2>
                            <p className="text-sm text-ink-muted mt-1">
                                Your family connections
                            </p>
                        </div>
                        {hasFamily && (
                            <button
                                onClick={() => navigate("/family")}
                                className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
                            >
                                {t("common.view")}
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {hasFamily ? (
                        <div className="space-y-4">
                            {user.families!.map((fm) => (
                                <div
                                    key={fm.id}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-soft">
                                            <Users className="h-4 w-4 text-emerald" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-ink">
                                                {fm.family.name}
                                            </p>
                                            <p className="text-xs text-ink-secondary capitalize">
                                                {fm.role.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-ink-muted">
                                        {new Date(fm.joinedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-ink-secondary mb-1">
                                You haven&apos;t connected a family yet.
                            </p>
                            <p className="text-sm text-ink-muted mb-6 max-w-md mx-auto">
                                Connect your family to discover relatives, relationships and community activity.
                            </p>
                            <Button
                                onClick={() => navigate("/families")}
                                size="sm"
                            >
                                <Users className="h-3.5 w-3.5" />
                                Connect family
                                <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    )}
                </motion.section>

                <div className="h-px bg-border" />

                {/* ─── Recent Activity ─── */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.15 }}
                    className="py-10"
                >
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-[18px] font-semibold text-ink">
                                {t("profile.recentActivity")}
                            </h2>
                            <p className="text-sm text-ink-muted mt-1">
                                Your community participation
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/activity")}
                            className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
                        >
                            {t("common.viewAll")}
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>

                    <div className="text-center py-8">
                        <p className="text-sm text-ink-secondary mb-1">
                            No activity yet
                        </p>
                        <p className="text-sm text-ink-muted">
                            Your events, requests, announcements and community participation will appear here.
                        </p>
                    </div>
                </motion.section>

            </div>
        </div>
    );
}
