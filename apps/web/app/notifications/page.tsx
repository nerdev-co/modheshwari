"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@repo/ui/button";
import { LoadingState } from "@repo/ui/loadingState";
import { useToast } from "@repo/ui/toast";
import { motion } from "framer-motion";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import useNotifications from "../../hooks/useNotifications";
import { useUser } from "../../lib/UserContext";
import { API_BASE } from "../../lib/config";
import { apiFetch } from "../../lib/api";
import { useLocale } from "../../lib/LocaleContext";

/**
 * Single notification item returned from backend.
 */
type Notification = {
    id?: string;
    previewId?: string;
    type?: string;
    message: string;
    createdAt: string;
    read?: boolean;
};

/**
 * Minimal authenticated user shape used on this page.
 */
type Role =
    | "COMMUNITY_HEAD"
    | "COMMUNITY_SUBHEAD"
    | "GOTRA_HEAD"
    | "FAMILY_HEAD"
    | "MEMBER";

type Priority = "low" | "normal" | "high" | "urgent";
type ReadFilter = "all" | "read" | "unread";
type SortBy = "newest" | "oldest" | "unread-first";

/**
 * Performs get token operation.
 * @returns {string} Description of return value
 */
function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}


/**
 * @param {Role} role - Description of role
 */
function isAdminRole(role?: Role): boolean {
    return (
        role === "COMMUNITY_HEAD" ||
        role === "COMMUNITY_SUBHEAD" ||
        role === "GOTRA_HEAD"
    );
}

/**
 * @param {Notification} n - Description of n
 */
function dedupeKey(n: Notification): string {
    if (n.id) return `id:${n.id}`;
    if (n.previewId) return `preview:${n.previewId}`;
    return `fallback:${n.message}:${n.createdAt}`;
}

/**
 * Performs  notifications page operation.
 * @returns {React.ReactElement} Description of return value
 */
export default function NotificationsPage(): React.ReactElement {
    const { notifications: hookNotifications, unreadCount, refresh, markRead, markAllRead, pulse } = useNotifications();
    const { toast } = useToast();
    const { t } = useLocale();
    const { user: me } = useUser();

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const [targetRole, setTargetRole] = useState("ALL");
    const [priority, setPriority] = useState<Priority>("normal");
    const [selectedChannels, setSelectedChannels] = useState<string[]>(["IN_APP"]);

    const [filterRead, setFilterRead] = useState<ReadFilter>("all");
    const [sortBy, setSortBy] = useState<SortBy>("newest");
    const [selectedType, setSelectedType] = useState<string>("all");

    const [loading, setLoading] = useState(true);
    const [broadcasting, setBroadcasting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = isAdminRole(me?.role as Role);

    const fetchNotifications = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            await refresh();
        } catch {
            setError(t("notifications.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [refresh]);

    /**
     * Initial load
     */
    useEffect(() => {
        void fetchNotifications();
    }, [fetchNotifications]);

    /**
     * Reset target role when role changes (avoid invalid selection)
     */
    useEffect(() => {
        setTargetRole("ALL");
    }, [me?.role]);

    // Hook now manages WS and incoming notifications.

    function toggleChannel(channel: string) {
        setSelectedChannels((prev) =>
            prev.includes(channel)
                ? prev.filter((c) => c !== channel)
                : [...prev, channel],
        );
    }

    async function handleBroadcast(e: React.FormEvent) {
        e.preventDefault();

        const token = getToken();
        if (!token) {
            toast(t("notifications.loginRequired"), { variant: "warning" });
            return;
        }

        if (!message.trim()) return;

        setBroadcasting(true);

        try {
            const body: {
                message: string;
                subject?: string;
                priority: Priority;
                channels: string[];
                targetRole?: string;
            } = {
                message: message.trim(),
                subject: subject.trim() || undefined,
                priority,
                channels: selectedChannels,
            };

            if (targetRole !== "ALL") body.targetRole = targetRole;

            const res = await apiFetch(`${API_BASE}/notifications`, {
                method: "POST",
                body: JSON.stringify(body),
            });

            setMessage("");
            setSubject("");
            setTargetRole("ALL");
            setPriority("normal");
            setSelectedChannels(["IN_APP"]);

            await fetchNotifications();
            toast(t("notifications.broadcastSent"), { variant: "success" });
        } catch {
            toast(t("notifications.networkError"), { variant: "error" });
        } finally {
            setBroadcasting(false);
        }
    }

    async function handleToggleRead(notificationId: string, currentRead: boolean) {
        try {
            const ok = await markRead(notificationId, currentRead);
            if (!ok) return;
            // hook updates notifications state
            await refresh();
        } catch (err) {
            console.error("Failed to update notification", err);
        }
    }

    async function handleMarkAllRead() {
        try {
            setLoading(true);
            await markAllRead();
            await refresh();
        } catch (err) {
            console.error("Failed to mark all read", err);
        } finally {
            setLoading(false);
        }
    }

    const notificationTypes = useMemo(() => {
        return Array.from(new Set(hookNotifications.map((n) => n.type).filter(Boolean))).sort();
    }, [hookNotifications]);

    const filteredNotifications = useMemo(() => {
        return hookNotifications
            .filter((n) => {
                if (filterRead === "read" && !n.read) return false;
                if (filterRead === "unread" && n.read) return false;
                if (selectedType !== "all" && n.type !== selectedType) return false;
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "newest") {
                    return +new Date(b.createdAt) - +new Date(a.createdAt);
                }
                if (sortBy === "oldest") {
                    return +new Date(a.createdAt) - +new Date(b.createdAt);
                }

                // unread-first
                if (a.read === b.read) {
                    return +new Date(b.createdAt) - +new Date(a.createdAt);
                }
                return a.read ? 1 : -1;
            });
    }, [hookNotifications, filterRead, selectedType, sortBy]);


    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-[800px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION_PAGE_ENTER} className="mb-14">
                    <h1 className="font-display text-display font-semibold leading-tight text-ink">{t("notifications.title")}</h1>
                    <p className="text-body-lg text-ink-secondary mt-1">{t("notifications.subtitle")}</p>
                </motion.div>

                <div className="h-px bg-border" />

                {error && (
                    <div className="mt-6 p-4 border border-ruby/30 bg-ruby/5 text-sm text-ruby">{error}</div>
                )}

                {isAdmin && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }} className="py-10">
                        <h2 className="text-heading-sm font-semibold text-ink mb-6">{t("notifications.broadcast")}</h2>
                        <form onSubmit={handleBroadcast} className="space-y-6">
                            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("notifications.subjectPlaceholder")}
                                className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron" />
                            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder={t("notifications.messagePlaceholder")}
                                className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron resize-none" />
                            <div className="flex flex-wrap items-center gap-3">
                                <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="px-3 py-2 text-sm border border-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-saffron">
                                    <option value="ALL">{t("notifications.allUsers")}</option>
                                    {me?.role === "COMMUNITY_HEAD" && (<><option value="COMMUNITY_HEAD">{t("role.community_head")}</option><option value="COMMUNITY_SUBHEAD">{t("role.community_subhead")}</option><option value="GOTRA_HEAD">{t("role.gotra_head")}</option><option value="FAMILY_HEAD">{t("role.family_head")}</option><option value="MEMBER">{t("role.member")}</option></>)}
                                    {me?.role === "COMMUNITY_SUBHEAD" && (<><option value="COMMUNITY_HEAD">{t("role.community_head")}</option><option value="COMMUNITY_SUBHEAD">{t("role.community_subhead")}</option><option value="GOTRA_HEAD">{t("role.gotra_head")}</option></>)}
                                    {me?.role === "GOTRA_HEAD" && (<><option value="FAMILY_HEAD">{t("role.family_head")}</option><option value="MEMBER">{t("role.member")}</option></>)}
                                </select>
                                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="px-3 py-2 text-sm border border-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-saffron">
                                    <option value="low">{t("notifications.priorityLow")}</option>
                                    <option value="normal">{t("notifications.priorityNormal")}</option>
                                    <option value="high">{t("notifications.priorityHigh")}</option>
                                    <option value="urgent">{t("notifications.priorityUrgent")}</option>
                                </select>
                                <Button type="submit" disabled={broadcasting || !message.trim()}>{broadcasting ? t("notifications.sending") : t("notifications.send")}</Button>
                            </div>
                            <fieldset className="space-y-3">
                                <legend className="block text-body font-medium text-ink-muted">{t("notifications.channels")}</legend>
                                <div className="flex gap-4">
                                    {["IN_APP", "EMAIL", "PUSH"].map((c) => (
                                        <label key={c} className="flex items-center gap-2 text-body text-ink">
                                            <input type="checkbox" checked={selectedChannels.includes(c)} onChange={() => toggleChannel(c)} className="accent-saffron" />
                                            {c}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            {(subject.trim() || message.trim()) && (
                                <div className="border border-border p-4">
                                    <p className="text-body font-medium text-ink">{subject.trim() || "\u2014"}</p>
                                    <p className="text-body text-ink-secondary mt-1">{message.trim()}</p>
                                </div>
                            )}
                        </form>
                        <div className="h-px bg-border mt-10" />
                    </motion.div>
                )}

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }} className="py-10">
                    <div className="flex flex-wrap gap-3 items-center mb-6">
                        <select value={filterRead} onChange={(e) => setFilterRead(e.target.value as ReadFilter)} className="px-3 py-1.5 text-sm border border-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-saffron">
                            <option value="all">{t("notifications.allOption")}</option>
                            <option value="unread">{t("notifications.unread")}</option>
                            <option value="read">{t("notifications.readOption")}</option>
                        </select>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="px-3 py-1.5 text-sm border border-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-saffron">
                            <option value="newest">{t("notifications.newest")}</option>
                            <option value="oldest">{t("notifications.oldest")}</option>
                            <option value="unread-first">{t("notifications.unreadFirst")}</option>
                        </select>
                        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-3 py-1.5 text-sm border border-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-saffron">
                            <option value="all">{t("notifications.allTypesOption")}</option>
                            {notificationTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                        </select>
                        <div className="ml-auto flex items-center gap-3">
                            <button onClick={() => void fetchNotifications()} className="text-body text-ink-muted hover:text-ink transition-colors">{t("notifications.refresh")}</button>
                            <button onClick={() => void handleMarkAllRead()} className="text-body text-ink-muted hover:text-ink transition-colors">{t("notifications.markAllRead")}</button>
                            {unreadCount > 0 && <span className={`text-body text-saffron ${pulse ? "animate-pulse font-semibold" : "font-medium"}`}>{t("notifications.unreadPrefix")}{unreadCount > 99 ? "99+" : unreadCount}</span>}
                        </div>
                    </div>

                    {loading ? (
                        <LoadingState message={t("common.loading")} />
                    ) : filteredNotifications.length === 0 ? (
                        <p className="text-center py-12 text-body text-ink-muted">{t("notifications.noNotifications")}</p>
                    ) : (
                        <div className="space-y-0">
                            {filteredNotifications.map((n) => {
                                const canToggleRead = Boolean(n.id);
                                return (
                                    <div key={dedupeKey(n)} className={`py-4 border-b border-border-subtle last:border-0 ${n.read ? "" : "bg-saffron/5"}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-body text-ink">{n.message}</p>
                                                <p className="text-caption text-ink-muted mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                                            </div>
                                            {canToggleRead && (
                                                <button onClick={() => void handleToggleRead(n.id!, !!n.read)} className="text-ink-muted hover:text-ink transition-colors flex-shrink-0" title={n.read ? t("notifications.markUnread") : t("notifications.markRead")}>
                                                    {n.read ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
