"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

import useNotifications from "../../hooks/useNotifications";
import { useUser } from "../../lib/UserContext";
import { API_BASE } from "../../lib/config";
import { apiFetch } from "../../lib/api";

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

export default function NotificationsPage(): React.ReactElement {
    const { notifications: hookNotifications, unreadCount, refresh, markRead, markAllRead, pulse } = useNotifications();
    const { toast } = useToast();
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
            setError("Failed to load notifications.");
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
            toast("Please login to broadcast notifications", { variant: "warning" });
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

            if (!res.ok) {
                const js = await res.json().catch(() => null);
                toast(js?.message || "Failed to broadcast", { variant: "error" });
                return;
            }

            setMessage("");
            setSubject("");
            setTargetRole("ALL");
            setPriority("normal");
            setSelectedChannels(["IN_APP"]);

            await fetchNotifications();
            toast("Broadcast sent", { variant: "success" });
        } catch {
            toast("Network error", { variant: "error" });
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
        <DreamySunsetBackground className="px-6 py-10">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-jewel-900 mb-2">
                        Notifications
                    </h1>
                    <p className="text-lg text-jewel-500">
                        Stay updated with system and community alerts
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-xl border border-jewel-ruby/30 bg-jewel-ruby/10 px-4 py-3 text-sm text-jewel-ruby">
                        {error}
                    </div>
                )}

                {/* Admin Broadcast */}
                {isAdmin && (
                    <section className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-8 mb-10">
                        <h2 className="text-2xl font-display font-bold text-jewel-900 mb-2">
                            Broadcast Notification
                        </h2>
                        <p className="text-jewel-500 mb-6">
                            You can notify users within your permitted scope.
                        </p>

                        <form onSubmit={handleBroadcast} className="space-y-6">
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Subject (optional)"
                                className="w-full bg-jewel-50/50 border border-jewel-400/30 rounded-xl px-4 py-3 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                            />

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                placeholder="Write a message to broadcast..."
                                className="w-full bg-jewel-50/50 border border-jewel-400/30 rounded-xl px-4 py-3 resize-none text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                            />

                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    className="bg-jewel-50/50 border border-jewel-400/30 rounded-xl px-4 py-3 text-jewel-900 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                                >
                                    <option value="ALL">All users</option>

                                    {me?.role === "COMMUNITY_HEAD" && (
                                        <>
                                            <option value="COMMUNITY_HEAD">Community Heads</option>
                                            <option value="COMMUNITY_SUBHEAD">
                                                Community Subheads
                                            </option>
                                            <option value="GOTRA_HEAD">Gotra Heads</option>
                                            <option value="FAMILY_HEAD">Family Heads</option>
                                            <option value="MEMBER">Members</option>
                                        </>
                                    )}

                                    {me?.role === "COMMUNITY_SUBHEAD" && (
                                        <>
                                            <option value="COMMUNITY_HEAD">Community Heads</option>
                                            <option value="COMMUNITY_SUBHEAD">
                                                Community Subheads
                                            </option>
                                            <option value="GOTRA_HEAD">Gotra Heads</option>
                                        </>
                                    )}

                                    {me?.role === "GOTRA_HEAD" && (
                                        <>
                                            <option value="FAMILY_HEAD">Family Heads</option>
                                            <option value="MEMBER">Members</option>
                                        </>
                                    )}
                                </select>

                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as Priority)}
                                    className="bg-jewel-50/50 border border-jewel-400/30 rounded-xl px-4 py-3 text-jewel-900 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="normal">Normal Priority</option>
                                    <option value="high">High Priority</option>
                                    <option value="urgent">Urgent</option>
                                </select>

                                <Button
                                    type="submit"
                                    disabled={broadcasting || !message.trim()}
                                >
                                    {broadcasting ? "Sending..." : "Send Notification"}
                                </Button>
                            </div>

                            {/* Channels */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-jewel-700">
                                    Channels
                                </label>
                                <div className="flex gap-3">
                                    {["IN_APP", "EMAIL", "PUSH"].map((c) => (
                                        <label key={c} className="flex items-center gap-2 text-jewel-700">
                                            <input
                                                type="checkbox"
                                                checked={selectedChannels.includes(c)}
                                                onChange={() => toggleChannel(c)}
                                                className="accent-jewel-gold"
                                            />
                                            {c}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            {(subject.trim() || message.trim()) && (
                                <div className="border border-jewel-400/20 rounded-xl p-4 bg-jewel-50/50">
                                    <p className="font-semibold text-jewel-900">{subject.trim() || "\u2014"}</p>
                                    <p className="text-jewel-700">{message.trim()}</p>
                                </div>
                            )}
                        </form>
                    </section>
                )}

                {/* Notifications List */}
                <section className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl overflow-hidden">
                    {/* Controls */}
                    <div className="p-4 border-b border-jewel-400/20 flex flex-wrap gap-3 items-center">
                        <select
                            value={filterRead}
                            onChange={(e) => setFilterRead(e.target.value as ReadFilter)}
                            className="border border-jewel-400/30 bg-jewel-50/50 rounded-xl px-3 py-2 text-sm text-jewel-900 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                        >
                            <option value="all">All</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="border border-jewel-400/30 bg-jewel-50/50 rounded-xl px-3 py-2 text-sm text-jewel-900 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="unread-first">Unread first</option>
                        </select>

                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="border border-jewel-400/30 bg-jewel-50/50 rounded-xl px-3 py-2 text-sm text-jewel-900 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                        >
                            <option value="all">All types</option>
                            {notificationTypes.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>

                        <div className="ml-auto flex items-center gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => void fetchNotifications()}
                            >
                                Refresh
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => void handleMarkAllRead()}
                            >
                                Mark all read
                            </Button>

                            <div className="text-sm text-jewel-gold">
                                {unreadCount > 0 && (
                                    <span className={`${pulse ? "animate-pulse font-semibold" : "font-medium"}`}>
                                        Unread: {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <p className="text-center py-12 text-jewel-500">Loading...</p>
                    ) : filteredNotifications.length === 0 ? (
                        <p className="text-center py-12 text-jewel-500">No notifications</p>
                    ) : (
                        <ul>
                            {filteredNotifications.map((n) => {
                                const canToggleRead = Boolean(n.id);

                                return (
                                    <li
                                        key={dedupeKey(n)}
                                        className={`p-6 border-b border-jewel-400/15 last:border-b-0 ${n.read ? "bg-jewel-50/40" : "bg-jewel-gold/5"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-jewel-900">{n.message}</p>
                                                <p className="text-xs text-jewel-400">
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            {canToggleRead && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => void handleToggleRead(n.id!, !!n.read)}
                                                    className="text-xs px-3 py-2 rounded-xl border border-jewel-400/20 bg-jewel-50/50 flex items-center justify-center text-jewel-600 hover:bg-jewel-100 transition-colors"
                                                    title={n.read ? "Mark unread" : "Mark read"}
                                                    aria-label={n.read ? "Mark unread" : "Mark read"}
                                                >
                                                    {n.read ? (
                                                        <Eye className="w-4 h-4" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </DreamySunsetBackground>
    );
}
