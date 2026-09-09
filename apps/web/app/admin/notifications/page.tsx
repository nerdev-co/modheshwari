"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

import { API_BASE } from "../../../lib/config";
import { apiFetch } from "../../../lib/api";
import { useLocale } from "../../../lib/LocaleContext";

const CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const ROLES = [
    "COMMUNITY_HEAD",
    "COMMUNITY_SUBHEAD",
    "GOTRA_HEAD",
    "FAMILY_HEAD",
    "MEMBER",
] as const;

/**
*/
export default function AdminNotifications() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t } = useLocale();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }
        try {
            const parts = token.split(".");
            if (parts.length >= 2) {
                const payload = JSON.parse(atob(parts[1]!));
                const role = payload.role || payload.userRole;
                if (["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(role)) {
                    setAuthorized(true);
                } else {
                    navigate("/me");
                }
            }
        } catch {
            navigate("/signin");
        }
    }, [navigate]);

    const [message, setMessage] = useState("");
    const [subject, setSubject] = useState("");
    const [selectedChannels, setSelectedChannels] = useState<string[]>([
        "IN_APP",
    ]);
    const [priority, setPriority] = useState<string>("normal");
    const [targetRole, setTargetRole] = useState<string | undefined>(undefined);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{
        error?: string;
        message?: string;
    } | null>(null);

    const toggleChannel = (ch: string) => {
        setSelectedChannels((prev) =>
            prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
        );
    };

    const send = async () => {
        setSending(true);
        setResult(null);
        try {
            const res = await apiFetch(`${API_BASE}/notifications`, {
                method: "POST",
                body: JSON.stringify({
                    message,
                    subject,
                    channels: selectedChannels,
                    priority,
                    targetRole,
                }),
            });
            const json = await res.json();
            setResult(json);
            if (res.ok) {
                setMessage("");
                setSubject("");
                toast(t("admin.notifications.notificationSent"), { variant: "success" });
            } else {
                toast(json.error || t("admin.notifications.failedToSend"), { variant: "error" });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            toast(msg || t("admin.notifications.failedToSend"), { variant: "error" });
        } finally {
            setSending(false);
        }
    };

    if (!authorized) return null;

    return (
        <DreamySunsetBackground className="px-6 py-10">
            <div className="max-w-3xl mx-auto bg-jewel-50/80 backdrop-blur-xl p-6 rounded-3xl border border-jewel-400/20 shadow-jewel">
                <h1 className="text-xl font-display font-bold text-jewel-900 mb-4">{t("admin.notifications.heading")}</h1>

                <div className="mb-3">
                    <label className="text-sm text-jewel-500">{t("admin.notifications.subjectLabel")}</label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full mt-1 p-2 rounded-xl bg-jewel-50/50 border border-jewel-400/30 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                    />
                </div>

                <div className="mb-3">
                    <label className="text-sm text-jewel-500">{t("admin.notifications.messageLabel")}</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full mt-1 p-2 rounded-xl bg-jewel-50/50 border border-jewel-400/30 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 resize-none"
                    />
                </div>

                <div className="mb-3 flex gap-4">
                    <div>
                        <div className="text-sm text-jewel-500 mb-1">{t("admin.notifications.channelsLabel")}</div>
                        <div className="flex gap-2">
                            {CHANNELS.map((ch) => (
                                <label key={ch} className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedChannels.includes(ch)}
                                        onChange={() => toggleChannel(ch)}
                                        className="accent-jewel-gold"
                                    />
                                    <span className="text-sm text-jewel-700">{ch}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-jewel-500 mb-1">{t("admin.notifications.priorityLabel")}</div>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="p-2 rounded-xl bg-jewel-50/50 border border-jewel-400/30 text-jewel-900"
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="text-sm text-jewel-500 mb-1">{t("admin.notifications.targetRoleLabel")}</div>
                        <select
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value || undefined)}
                            className="p-2 rounded-xl bg-jewel-50/50 border border-jewel-400/30 text-jewel-900"
                        >
                            <option value="">{t("admin.notifications.targetRoleAll")}</option>
                            {ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
                        {t("admin.notifications.preview")}
                    </Button>
                    <Button
                        onClick={send}
                        disabled={sending || !message.trim()}
                    >
                        {sending ? t("admin.notifications.sending") : t("admin.notifications.send")}
                    </Button>
                </div>

                {result && (
                    <div className="mt-4 p-3 bg-jewel-100/40 rounded-xl border border-jewel-400/20">
                        <pre className="text-xs text-jewel-700 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}

                {previewOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-jewel-900/30 backdrop-blur-sm">
                        <div className="bg-jewel-50 p-6 rounded-3xl border border-jewel-400/20 shadow-jewel w-[min(800px,95%)]">
                            <h2 className="text-lg font-display font-bold text-jewel-900 mb-2">{t("admin.notifications.preview")}</h2>
                            {subject && <div className="font-bold text-jewel-900 mb-1">{subject}</div>}
                            <div className="mb-4 text-jewel-800">{message}</div>
                            <div className="text-sm text-jewel-500 mb-4">
                                Channels: {selectedChannels.join(", ")} • Priority: {priority}
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
                                    {t("admin.notifications.close")}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setPreviewOpen(false);
                                        send();
                                    }}
                                >
                                    {t("admin.notifications.send")}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DreamySunsetBackground>
    );
}
