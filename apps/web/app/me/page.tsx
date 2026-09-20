"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { Button } from "@repo/ui/button";
import { formatBloodGroup } from "@modheshwari/utils/format";
import {
    Users,
    ChevronRight,
    ArrowRight,
    Mail,
    Phone,
    MapPin,
    Droplet,
    Briefcase,
    GitBranch,
    Calendar,
    Activity,
} from "lucide-react";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import { useUser } from "../../lib/UserContext";
import { useLocale } from "../../lib/LocaleContext";

const ROLE_COLORS: Record<string, string> = {
    COMMUNITY_HEAD: "bg-saffron",
    COMMUNITY_SUBHEAD: "bg-ink-secondary",
    GOTRA_HEAD: "bg-emerald",
    FAMILY_HEAD: "bg-ink-muted",
    MEMBER: "bg-ink-muted",
};

const ROLE_LABELS: Record<string, string> = {
    COMMUNITY_HEAD: "Community Head",
    COMMUNITY_SUBHEAD: "Community Subhead",
    GOTRA_HEAD: "Gotra Head",
    FAMILY_HEAD: "Family Head",
    MEMBER: "Member",
};

/**
 * Performs  me page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function MePage() {
    const navigate = useNavigate();
    const { user, loading } = useUser();
    const { t } = useLocale();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/signin");
        }
    }, [loading, user, navigate]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoaderOne />
            </div>
        );
    }

    if (!user) {
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

    const roleColor = ROLE_COLORS[user.role] || "bg-ink-muted";
    const roleLabel = ROLE_LABELS[user.role] || user.role?.toLowerCase().replace(/_/g, " ") || "member";

    const personalFields = [
        {
            label: t("profile.bloodGroup"),
            value: formatBloodGroup(user.profile?.bloodGroup),
            icon: Droplet,
        },
        {
            label: t("profile.gotra"),
            value: user.profile?.gotra,
            icon: GitBranch,
        },
        {
            label: t("profile.profession"),
            value: user.profile?.profession,
            icon: Briefcase,
        },
    ];

    const contactFields = [
        {
            label: t("profile.email"),
            value: user.email,
            icon: Mail,
        },
        {
            label: t("profile.phone"),
            value: user.profile?.phone,
            icon: Phone,
        },
        {
            label: t("profile.location"),
            value: user.profile?.location,
            icon: MapPin,
        },
    ];

    const hasPersonalData = personalFields.some((f) => f.value);
    const hasContactData = contactFields.some((f) => f.value);

    return (
        <div className="min-h-screen bg-canvas">
            <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">

                {/* ─── Profile Header ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="mb-14"
                >
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-6 min-w-0">
                            <div
                                className={`flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white ${roleColor}`}
                            >
                                {initials}
                            </div>
                            <div className="pt-2 min-w-0">
                                <h1 className="font-display-bold text-display leading-tight text-ink truncate">
                                    {user.name || t("profile.unnamedMember")}
                                </h1>
                                <p className="text-body-lg text-ink-secondary mt-1">
                                    {t("profile.memberOfCommunity")}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-ink-muted">
                                    <span className="capitalize">{roleLabel}</span>
                                    <span className="text-border-strong">·</span>
                                    <span className="status-active text-xs px-2 py-0.5">{t("profile.active")}</span>
                                    <span className="text-border-strong">·</span>
                                    <span>{t("profile.memberSince", { date: memberSince })}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/me/edit")}
                            className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1 mt-2 shrink-0"
                        >
                            {t("profile.editProfile")}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </motion.div>

                <hr className="editorial-divider mb-14" />

                {/* ─── About Section ─── */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }}
                    className="py-10"
                >
                    <div className="mb-10">
                        <h2 className="heading text-ink">{t("profile.about")}</h2>
                        <p className="body text-ink-secondary mt-1">
                            {t("profile.aboutDesc")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Personal Column */}
                        <div>
                            <h3 className="caption text-ink-muted mb-4">
                                {t("profile.personal")}
                            </h3>
                            <div className="h-px bg-border-subtle mb-4" />
                            {hasPersonalData ? (
                                <dl className="space-y-4">
                                    {personalFields.map((field) => (
                                        <div key={field.label} className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                                                <field.icon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <dt className="caption text-ink-muted">{field.label}</dt>
                                                <dd className="body font-medium text-ink truncate">
                                                    {field.value || <span className="text-ink-muted">{t("common.notSet")}</span>}
                                                </dd>
                                            </div>
                                        </div>
                                    ))}
                                </dl>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="body text-ink-secondary mb-2">
                                        {t("profile.noPersonalDetails")}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/me/edit")}
                                    >
                                        {t("common.addDetails")}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Contact Column */}
                        <div>
                            <h3 className="caption text-ink-muted mb-4">
                                {t("profile.contact")}
                            </h3>
                            <div className="h-px bg-border-subtle mb-4" />
                            {hasContactData ? (
                                <dl className="space-y-4">
                                    {contactFields.map((field) => (
                                        <div key={field.label} className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                                                <field.icon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <dt className="caption text-ink-muted">{field.label}</dt>
                                                <dd className="body font-medium text-ink truncate">
                                                    {field.value || <span className="text-ink-muted">{t("common.notSet")}</span>}
                                                </dd>
                                            </div>
                                        </div>
                                    ))}
                                </dl>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="body text-ink-secondary mb-2">
                                        {t("profile.noContactDetails")}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/me/edit")}
                                    >
                                        {t("common.addDetails")}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-border-subtle">
                        <button
                            onClick={() => navigate("/me/edit")}
                            className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
                        >
                            {t("common.edit")}
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </motion.section>

                <hr className="editorial-divider my-14" />

                {/* ─── Family Section ─── */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                    className="py-10"
                >
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <h2 className="heading text-ink">{t("profile.yourFamily")}</h2>
                            <p className="body text-ink-secondary mt-1">
                                {t("profile.familyDesc")}
                            </p>
                        </div>
                        {hasFamily && (
                            <button
                                onClick={() => navigate("/family")}
                                className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1 shrink-0"
                            >
                                {t("common.viewAll")}
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {hasFamily ? (
                        <dl className="divide-y divide-border-subtle">
                            {user.families!.map((fm) => (
                                <div key={fm.id} className="py-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-soft">
                                            <Users className="h-5 w-5 text-emerald" aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0">
                                            <dt className="body font-medium text-ink truncate">
                                                {fm.family.name}
                                            </dt>
                                            <dd className="caption text-ink-secondary capitalize flex items-center gap-2 mt-0.5">
                                                {fm.role.replace(/_/g, " ")}
                                                <span className="text-border-strong">·</span>
                                                <time dateTime={fm.joinedAt}>
                                                    {new Date(fm.joinedAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </time>
                                            </dd>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate("/family")}
                                        className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1 shrink-0"
                                    >
                                        {t("common.view")}
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted mb-4">
                                <Users className="h-8 w-8 text-ink-muted" aria-hidden="true" />
                            </div>
                            <h3 className="heading-sm text-ink mb-2">
                                {t("profile.noFamilyTitle")}
                            </h3>
                            <p className="body text-ink-muted mb-6 max-w-md mx-auto">
                                {t("profile.noFamilyDescription")}
                            </p>
                            <Button
                                onClick={() => navigate("/families")}
                                size="md"
                            >
                                <Users className="h-4 w-4" />
                                {t("profile.connectFamily")}
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </motion.section>

                <hr className="editorial-divider my-14" />

                {/* ─── Recent Activity ─── */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.15 }}
                    className="py-10"
                >
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <h2 className="heading text-ink">{t("profile.recentActivity")}</h2>
                            <p className="body text-ink-secondary mt-1">
                                {t("profile.activityDescription")}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/activity")}
                            className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1 shrink-0"
                        >
                            {t("common.viewAll")}
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>

                    <div className="text-center py-12">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted mb-4">
                            <Activity className="h-8 w-8 text-ink-muted" aria-hidden="true" />
                        </div>
                        <h3 className="heading-sm text-ink mb-2">
                            {t("profile.noActivityTitle")}
                        </h3>
                        <p className="body text-ink-muted mb-6 max-w-md mx-auto">
                            {t("profile.activityWillAppear")}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate("/events")}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                {t("dashboard.createEvent")}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/resources")}
                            >
                                {t("resources.createTitle")}
                            </Button>
                        </div>
                    </div>
                </motion.section>

            </div>
        </div>
    );
}