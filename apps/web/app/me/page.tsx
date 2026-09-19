"use client";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { Button } from "@repo/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { formatBloodGroup } from "@modheshwari/utils/format";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    BookOpen,
    Droplet,
    Calendar,
    Users,
    Settings,
    LogOut,
    Link2,
    Plus,
    ChevronRight,
} from "lucide-react";
import { MOTION_PAGE_ENTER, FADE_IN_UP } from "@repo/ui/motion";
import { Activity } from "lucide-react";
import { useUser } from "../../lib/UserContext";
import { useLocale } from "../../lib/LocaleContext";
import { ROLE_COLORS_CSS } from "../../lib/constants";

export default function MePage() {
    const navigate = useNavigate();
    const { user, loading, logout } = useUser();
    const { t } = useLocale();

    if (loading) {
        return (
            <div className="bg-canvas flex min-h-[60vh] items-center justify-center">
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
    const primaryFamily = user.families?.[0];

    const personalFields = [
        {
            label: t("profile.bloodGroup"),
            value: formatBloodGroup(user.profile?.bloodGroup),
            icon: Droplet,
        },
        {
            label: t("profile.gotra"),
            value: user.profile?.gotra,
            icon: BookOpen,
        },
        {
            label: t("profile.profession"),
            value: user.profile?.profession,
            icon: Briefcase,
        },
        {
            label: t("profile.location"),
            value: user.profile?.location,
            icon: MapPin,
        },
        { label: t("profile.phone"), value: user.profile?.phone, icon: Phone },
        {
            label: t("profile.address"),
            value: user.profile?.address,
            icon: MapPin,
        },
    ].filter((f) => f.value);

    const contactFields = [
        { label: t("profile.email"), value: user.email, icon: Mail },
    ].filter((f) => f.value);

    return (
        <div className="bg-canvas min-h-screen">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                {/* Profile Header */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="mb-10"
                >
                    <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div
                                    className="text-ink flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold shadow-lg"
                                    style={{
                                        background:
                                            ROLE_COLORS_CSS[user.role] ||
                                            "var(--jewel-400)",
                                    }}
                                >
                                    {initials}
                                </div>
                                {user.status && (
                                    <span className="bg-emerald border-canvas absolute right-2 bottom-2 h-4 w-4 rounded-full border-3" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-display-lg text-ink font-display-bold">
                                    {user.name || t("profile.member")}
                                </h1>
                                <div className="mt-1 flex flex-wrap items-center gap-3">
                                    <span className="bg-saffron-soft text-saffron border-saffron/30 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                                        <span className="bg-saffron h-1.5 w-1.5 rounded-full" />
                                        {t("profile.active")}
                                    </span>
                                    <Badge
                                        variant="gold"
                                        size="sm"
                                        shape="rounded"
                                        className="capitalize"
                                    >
                                        {user.role
                                            ?.toLowerCase()
                                            .replace(/_/g, " ") || "member"}
                                    </Badge>
                                </div>
                                <p className="text-body text-ink-secondary mt-2 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t("profile.memberSince")} {memberSince}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                variant="secondary"
                                onClick={() => navigate("/me/edit")}
                            >
                                <Settings className="h-4 w-4" />
                                {t("profile.editProfile")}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    logout();
                                    navigate("/signin");
                                }}
                            >
                                <LogOut className="h-4 w-4" />
                                {t("profile.signOut")}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-border h-px" aria-hidden="true" />
                </motion.section>

                {/* About & Family Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                    className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2"
                >
                    {/* About Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-heading text-ink font-display-bold">
                                        {t("profile.about")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("profile.personalDetails")}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate("/me/edit")}
                                >
                                    <Settings className="h-4 w-4" />
                                    {t("common.edit")}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {personalFields.length > 0 ? (
                                <dl className="space-y-4">
                                    {personalFields.map((field, idx) => (
                                        <motion.div
                                            key={field.label}
                                            variants={FADE_IN_UP}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.2,
                                                delay: idx * 0.04,
                                            }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="bg-surface-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                                                <field.icon className="text-ink-muted h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <dt className="text-caption text-ink-muted tracking-wide uppercase">
                                                    {field.label}
                                                </dt>
                                                <dd className="text-body text-ink mt-0.5 truncate">
                                                    {field.value}
                                                </dd>
                                            </div>
                                        </motion.div>
                                    ))}
                                </dl>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-ink-secondary mb-4">
                                        {t("profile.noPersonalDetails")}
                                    </p>
                                    <Button
                                        onClick={() => navigate("/me/edit")}
                                        size="sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t("profile.addDetails")}
                                    </Button>
                                </div>
                            )}

                            {contactFields.length > 0 && (
                                <div className="border-border mt-6 border-t pt-6">
                                    <h4 className="text-ink mb-3 text-sm font-semibold">
                                        {t("profile.contact")}
                                    </h4>
                                    <dl className="space-y-3">
                                        {contactFields.map((field, idx) => (
                                            <motion.div
                                                key={field.label}
                                                variants={FADE_IN_UP}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.2,
                                                    delay: idx * 0.04,
                                                }}
                                                className="flex items-center gap-3"
                                            >
                                                <field.icon className="text-ink-muted h-5 w-5 flex-shrink-0" />
                                                <div>
                                                    <dt className="text-caption text-ink-muted">
                                                        {field.label}
                                                    </dt>
                                                    <dd className="text-body text-ink">
                                                        {field.value}
                                                    </dd>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </dl>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Family Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-heading text-ink font-display-bold">
                                        {t("profile.yourFamily")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("profile.familyDescription")}
                                    </CardDescription>
                                </div>
                                {hasFamily && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/family")}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                        {t("common.view")}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {hasFamily ? (
                                <div className="space-y-4">
                                    {user.families!.map((fm, idx) => (
                                        <motion.div
                                            key={fm.id}
                                            variants={FADE_IN_UP}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.2,
                                                delay: idx * 0.04,
                                            }}
                                            className="bg-surface-muted flex items-center gap-4 rounded-lg p-3"
                                        >
                                            <div className="bg-emerald-soft flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                                                <Users className="text-emerald h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-ink truncate font-semibold">
                                                    {fm.family.name}
                                                </p>
                                                <p className="text-ink-secondary text-sm capitalize">
                                                    {fm.role.replace(/_/g, " ")}
                                                </p>
                                            </div>
                                            <span className="text-caption text-ink-muted flex-shrink-0">
                                                {t("profile.joined")}{" "}
                                                {new Date(
                                                    fm.joinedAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="bg-surface-muted mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
                                        <Users className="text-ink-muted h-7 w-7" />
                                    </div>
                                    <p className="text-body text-ink-secondary mb-2">
                                        {t("profile.noFamilyConnected")}
                                    </p>
                                    <p className="text-ink-muted mx-auto mb-6 max-w-sm text-sm">
                                        {t("profile.connectFamilyDesc")}
                                    </p>
                                    <Button
                                        onClick={() => navigate("/families")}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t("profile.connectFamily")}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Activity Section */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.2 }}
                >
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-heading text-ink font-display-bold">
                                        {t("profile.recentActivity")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("profile.activityDescription")}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate("/activity")}
                                >
                                    {t("common.viewAll")}
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="py-10 text-center">
                                <div className="bg-surface-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                                    <Activity className="text-ink-muted h-6 w-6" />
                                </div>
                                <p className="text-body text-ink-secondary mb-1">
                                    {t("profile.noActivity")}
                                </p>
                                <p className="text-ink-muted text-sm">
                                    {t("profile.activityWillAppear")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.section>
            </div>
        </div>
    );
}
