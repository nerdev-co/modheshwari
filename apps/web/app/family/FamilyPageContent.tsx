"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui/card";
import { EmptyState } from "@repo/ui/emptyState";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Skull,
  Filter,
  ChevronDown,
  ChevronUp,
  UserPlus,
} from "lucide-react";
import { FADE_IN_UP, MOTION_PAGE_ENTER, STAGGER_CONTAINER, STAGGER_ITEM } from "@repo/ui/motion";

import { API_BASE } from "../../lib/config";
import { apiFetch } from "../../lib/api";
import { useToast } from "@repo/ui/toast";
import { useLocale } from "../../lib/LocaleContext";

/**
 * Type for a single family member.
 */
interface Member {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        status: boolean;
    };
}

/**
 * Family Page - Displays and manages family members and their status.
 */
export default function FamilyPageContent() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t } = useLocale();

    const [hydrated, setHydrated] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "name", direction: "asc" });

    useEffect(() => {
        setHydrated(true);
        const savedToken = localStorage.getItem("token");
        setToken(savedToken);
    }, []);

    const fetchMembers = useCallback(
        async (all = false, signal?: AbortSignal) => {
            if (!token) return;

            setLoading(true);
            try {
                const res = await apiFetch(
                    `${API_BASE}/family/members${all ? "?all=true" : ""}`,
                    { signal },
                );

                if (res.status === 401) {
                    navigate(`/signin?next=/family`);
                    return;
                }

                if (!res.ok) throw new Error("Failed to fetch members");

                const data = await res.json();
                setMembers(data.data?.members || []);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                console.error("Error fetching members:", err);
            } finally {
                setLoading(false);
            }
        },
        [token, navigate],
    );

    const toggleStatus = async (userId: string, currentStatus: boolean) => {
        if (!token) return;

        try {
            const res = await apiFetch(`${API_BASE}/users/${userId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: !currentStatus }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            setMembers((prev) =>
                prev.map((m) =>
                    m.user.id === userId
                        ? { ...m, user: { ...m.user, status: !currentStatus } }
                        : m,
                ),
            );
        } catch {
            toast(t("family.toastStatusFailed"), { variant: "error" });
        }
    };

    const handleSort = (key: string) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const sortedMembers = [...members].sort((a, b) => {
        const aVal = sortConfig.key === "name" ? a.user.name : a.user.status;
        const bVal = sortConfig.key === "name" ? b.user.name : b.user.status;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    const filteredMembers = showAll ? sortedMembers : sortedMembers.filter((m) => m.user.status);

    const aliveCount = members.filter((m) => m.user.status).length;
    const deceasedCount = members.filter((m) => !m.user.status).length;

    useEffect(() => {
        if (!token) return;
        const controller = new AbortController();
        fetchMembers(showAll, controller.signal);
        return () => controller.abort();
    }, [token, showAll, fetchMembers]);

    if (hydrated && !token) return <NotAuthenticated />;
    if (!hydrated) return null;
    if (loading) return <LoaderOne />;

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={MOTION_PAGE_ENTER}
                className="grid grid-cols-1 sm:grid-cols-4 gap-4"
            >
                <Card className="p-4 bg-saffron-soft border-saffron/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-saffron flex items-center justify-center">
                            <Users className="w-5 h-5 text-ink-on-accent" />
                        </div>
                        <div>
                            <p className="text-caption text-ink-muted">{t("family.totalMembers")}</p>
                            <p className="text-heading font-display-bold text-ink text-numbers">{members.length}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-emerald-soft border-emerald/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald flex items-center justify-center">
                            <HeartPulse className="w-5 h-5 text-ink-on-accent" />
                        </div>
                        <div>
                            <p className="text-caption text-ink-muted">{t("family.alive")}</p>
                            <p className="text-heading font-display-bold text-ink text-numbers">{aliveCount}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-ruby-soft border-ruby/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ruby flex items-center justify-center">
                            <Skull className="w-5 h-5 text-ink-on-accent" />
                        </div>
                        <div>
                            <p className="text-caption text-ink-muted">{t("family.deceased")}</p>
                            <p className="text-heading font-display-bold text-ink text-numbers">{deceasedCount}</p>
                        </div>
                    </div>
                </Card>

                {/* Filter Tile */}
                <Card className="p-4 bg-surface-muted border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-ink-muted" />
                            <span className="text-sm font-medium text-ink">{showAll ? t("family.showingAll") : t("family.aliveOnly")}</span>
                        </div>
                        <Button
                            variant={showAll ? "secondary" : "primary"}
                            size="sm"
                            onClick={() => setShowAll((prev) => !prev)}
                            className="flex items-center gap-1.5"
                        >
                            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{showAll ? t("family.showAlive") : t("family.showAll")}</span>
                        </Button>
                    </div>
                </Card>
            </motion.div>

            {/* Members Table/List */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
            >
                <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="border-b border-border bg-surface-muted px-4 py-3">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_80px] gap-4 text-sm font-semibold text-ink-muted">
                            <button
                                onClick={() => handleSort("name")}
                                className="flex items-center gap-1.5 hover:text-ink transition-colors text-left"
                            >
                                {t("family.name")}
                                {sortConfig.key === "name" && (
                                    sortConfig.direction === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                )}
                            </button>
                            <button
                                onClick={() => handleSort("status")}
                                className="flex items-center gap-1.5 hover:text-ink transition-colors justify-center"
                            >
                                {t("family.status")}
                                {sortConfig.key === "status" && (
                                    sortConfig.direction === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                )}
                            </button>
                            <span className="justify-center">{t("family.role")}</span>
                            <span className="justify-end">{t("family.actions")}</span>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border">
                        {filteredMembers.length > 0 ? (
                            <motion.div variants={STAGGER_CONTAINER}>
                                {filteredMembers.map((m, index) => (
                                    <motion.div
                                        key={m.id}
                                        variants={STAGGER_ITEM}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        className="px-4 py-3 hover:bg-surface-muted transition-colors"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_80px] gap-4 items-center">
                                            {/* Name */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-saffron-soft flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-semibold text-saffron">
                                                        {m.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-ink truncate">{m.user.name}</p>
                                                    <p className="text-xs text-ink-muted truncate">{m.user.email}</p>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="justify-center md:justify-center">
                                                <Badge
                                                    variant={m.user.status ? "emerald" : "ruby"}
                                                    size="sm"
                                                    dot
                                                >
                                                    {m.user.status ? t("family.alive") : t("family.deceased")}
                                                </Badge>
                                            </div>

                                            {/* Role */}
                                            <div className="text-center md:justify-center">
                                                <span className="text-sm text-ink-secondary capitalize">
                                                    {m.user.status ? "Member" : "Deceased"}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-end md:justify-end items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleStatus(m.user.id, m.user.status)}
                                                    className="text-ink-secondary hover:text-saffron"
                                                    aria-label={m.user.status ? t("family.markDeceased") : t("family.markAlive")}
                                                >
                                                    {m.user.status ? (
                                                        <Skull className="w-4 h-4" />
                                                    ) : (
                                                        <HeartPulse className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="px-4 py-12 text-center">
                                <EmptyState
                                    icon={Users}
                                    title={showAll ? t("family.noMembersAll") : t("family.noMembersAlive")}
                                    description={showAll
                                        ? t("family.noMembersAllDesc")
                                        : t("family.noMembersAliveDesc")}
                                    action={{
                                        label: t("family.inviteMember"),
                                        onClick: () => navigate("/families"),
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </motion.section>
        </div>
    );
}