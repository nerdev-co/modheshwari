"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Calendar,
    MapPin,
    Users,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";
import { LoadingState } from "@repo/ui/loadingState";
import { EmptyState } from "@repo/ui/emptyState";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";
import { motion } from "framer-motion";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import apiFetch from "../../../lib/api";
import { API_BASE } from "../../../lib/config";
import { useLocale } from "../../../lib/LocaleContext";

interface EventDetails {
    id: string;
    name: string;
    description?: string;
    date: string;
    venue?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    approvals: Array<{
        id: string;
        status: string;
        remarks?: string;
        reviewedAt?: string;
        approver: {
            id: string;
            name: string;
            role: string;
        };
    }>;
    registrations: Array<{
        id: string;
        userId: string;
        registeredAt: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    _count: {
        registrations: number;
    };
    createdAt: string;
}

/**
 * Performs  event details page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function EventDetailsPage() {
    const { t } = useLocale();
    const navigate = useNavigate();
    const params = useParams();
    const { toast } = useToast();
    const eventId = params?.id as string;

    const [hydrated, setHydrated] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [moderating, setModerating] = useState(false);
    const [moderationRemarks, setModerationRemarks] = useState("");

    useEffect(() => {
        setHydrated(true);
        const savedToken = localStorage.getItem("token");
        setToken(savedToken);

        //decode to get userId and userRole
        if (savedToken) {
            try {
                const parts = savedToken.split(".");
                if (parts.length >= 2) {
                    const payload = JSON.parse(atob(parts[1]!));
                    setUserRole(payload.role || payload.userRole || null);
                }
            } catch (err) {
                console.error("Failed to decode token:", err);
            }
        }
    }, []);

    const fetchEvent = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const data = await apiFetch(`${API_BASE}/events/${eventId}`, { signal });
            const fetchedEvent = data?.data?.event as EventDetails;
            setEvent(fetchedEvent);

            const savedToken = localStorage.getItem("token");
            if (savedToken) {
                try {
                    const parts = savedToken.split(".");
                    if (parts.length >= 2) {
                        const payload = JSON.parse(atob(parts[1]!));
                        const uid = payload.userId || payload.id;
                        if (uid && fetchedEvent.registrations) {
                            const userRegistration = fetchedEvent.registrations.find(
                                (r) => r.userId === uid,
                            );
                            setIsRegistered(!!userRegistration);
                        }
                    }
                } catch { /* ignore */ }
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            console.error("Error fetching event:", error);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (!hydrated || !eventId) return;
        const controller = new AbortController();
        fetchEvent(controller.signal);
        return () => controller.abort();
    }, [hydrated, eventId, fetchEvent]);

    const handleRegister = async () => {
        if (!token) return;

        setRegistering(true);
        try {
            await apiFetch(`${API_BASE}/events/${eventId}/register`, {
                method: "POST",
            });
            setIsRegistered(true);
            fetchEvent();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            toast(msg || t("events.detail.toastRegisterFailed"), { variant: "error" });
        } finally {
            setRegistering(false);
        }
    };

    const handleUnregister = async () => {
        if (!token) return;

        setRegistering(true);
        try {
            await apiFetch(`${API_BASE}/events/${eventId}/register`, {
                method: "DELETE",
            });
            setIsRegistered(false);
            fetchEvent();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            toast(msg || t("events.detail.toastUnregisterFailed"), { variant: "error" });
        } finally {
            setRegistering(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config = {
            APPROVED: {
                icon: CheckCircle,
                color: "text-emerald border-emerald/30",
                label: t("events.detail.statusApproved"),
            },
            PENDING: {
                icon: Clock,
                color: "text-saffron border-saffron/30",
                label: t("events.detail.statusPending"),
            },
            REJECTED: {
                icon: XCircle,
                color: "text-ruby border-ruby/30",
                label: t("events.detail.statusRejected"),
            },
            CANCELLED: {
                icon: XCircle,
                color: "text-ink-muted border-border",
                label: t("events.detail.statusCancelled"),
            },
        };

        const {
            icon: Icon,
            color,
            label,
        } = config[status as keyof typeof config] || config.PENDING;

        return (
            <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${color}`}
            >
                <Icon className="w-4 h-4" />
                {label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleModeration = async (status: "APPROVED" | "REJECTED") => {
        if (!token) return toast(t("events.detail.toastAdminRequired"), { variant: "warning" });

        setModerating(true);
        try {
            await apiFetch(`${API_BASE}/events/${eventId}/approve`, {
                method: "POST",
                body: JSON.stringify({ status, remarks: moderationRemarks }),
            });

            setModerationRemarks("");
            await fetchEvent();
            toast(t("events.detail.toastModerationRecorded", { status }), { variant: "success" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toast(msg || t("events.detail.toastModerationFailed"), { variant: "error" });
        } finally {
            setModerating(false);
        }
    };

    const isAdmin = !!(
        userRole &&
        ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(userRole)
    );

    if (hydrated && !token) return <NotAuthenticated />;
    if (!hydrated) return null;

    if (loading) return <LoadingState message="Loading event..." />;

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <EmptyState
                    title={t("events.detail.notFound")}
                    action={{ label: t("events.detail.backToEvents"), onClick: () => navigate("/events") }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-[800px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION_PAGE_ENTER}>
                    <button onClick={() => navigate(-1)} className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-10">
                        <ArrowLeft className="h-3 w-3" />
                        {t("events.detail.backToEvents")}
                    </button>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }}>
                    <div className="flex items-center justify-between mb-6">
                        {getStatusBadge(event.status)}
                        <span className="flex items-center gap-2 text-[13px] text-ink-muted">
                            <Users className="w-4 h-4" />
                            {event._count.registrations} {t("events.detail.registered")}
                        </span>
                    </div>

                    <h1 className="font-display text-[36px] font-semibold leading-tight text-ink mb-4">{event.name}</h1>

                    {event.description && <p className="text-[15px] text-ink-secondary mb-8 leading-relaxed">{event.description}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="flex items-start gap-3 p-4 border border-border">
                            <Calendar className="w-4 h-4 text-saffron mt-0.5" />
                            <div>
                                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-1">{t("events.detail.dateTime")}</p>
                                <p className="text-[14px] text-ink">{formatDate(event.date)}</p>
                            </div>
                        </div>
                        {event.venue && (
                            <div className="flex items-start gap-3 p-4 border border-border">
                                <MapPin className="w-4 h-4 text-saffron mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-1">{t("events.detail.venue")}</p>
                                    <p className="text-[14px] text-ink">{event.venue}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 border border-border mb-8">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-2">{t("events.detail.organizedBy")}</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-saffron-soft flex items-center justify-center text-saffron text-sm font-semibold">
                                {event.createdBy.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[14px] font-medium text-ink">{event.createdBy.name}</p>
                                <p className="text-[12px] text-ink-muted">{event.createdBy.email}</p>
                            </div>
                        </div>
                    </div>

                    {event.status === "APPROVED" && (
                        <div className="flex gap-3 mb-8">
                            {isRegistered ? (
                                <Button variant="danger" onClick={handleUnregister} disabled={registering} className="flex-1">
                                    {registering ? t("events.detail.unregistering") : t("events.detail.unregister")}
                                </Button>
                            ) : (
                                <Button onClick={handleRegister} disabled={registering} className="flex-1">
                                    {registering ? t("events.detail.registering") : t("events.detail.registerForEvent")}
                                </Button>
                            )}
                        </div>
                    )}

                    {event.status === "PENDING" && (
                        <div className="p-4 border border-saffron/30 bg-saffron/5 text-[14px] text-ink-secondary mb-8">
                            <strong>{t("events.detail.pendingApprovalLabel")}</strong> {t("events.detail.pendingApprovalMessage")}
                        </div>
                    )}

                    {event.status === "REJECTED" && (
                        <div className="p-4 border border-ruby/30 bg-ruby/5 text-[14px] text-ruby mb-8">
                            <strong>{t("events.detail.rejectedLabel")}</strong> {t("events.detail.rejectedMessage")}
                        </div>
                    )}

                    {event.status === "CANCELLED" && (
                        <div className="p-4 border border-border text-[14px] text-ink-muted mb-8">
                            <strong>{t("events.detail.cancelledLabel")}</strong> {t("events.detail.cancelledMessage")}
                        </div>
                    )}
                </motion.div>

                {event.approvals && event.approvals.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }} className="mt-10">
                        <div className="h-px bg-border mb-10" />
                        <h2 className="text-[18px] font-semibold text-ink mb-6">{t("events.detail.approvalStatus")}</h2>
                        <div className="space-y-3">
                            {event.approvals.map((approval) => (
                                <div key={approval.id} className="flex items-center justify-between gap-4 py-4 border-b border-border-subtle last:border-0">
                                    <div>
                                        <p className="text-[14px] font-medium text-ink">{approval.approver.name}</p>
                                        <p className="text-[12px] text-ink-muted">{approval.approver.role.replace(/_/g, " ")}</p>
                                    </div>
                                    <span className={`text-[12px] font-medium ${approval.status === "APPROVED" ? "text-emerald" : approval.status === "REJECTED" ? "text-ruby" : "text-saffron"}`}>
                                        {approval.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {isAdmin && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...MOTION_PAGE_ENTER, delay: 0.15 }} className="mt-10">
                        <div className="h-px bg-border mb-10" />
                        <h2 className="text-[18px] font-semibold text-ink mb-3">{t("events.detail.moderation")}</h2>
                        <p className="text-[14px] text-ink-muted mb-4">{t("events.detail.moderationDescription")}</p>
                        <textarea value={moderationRemarks} onChange={(e) => setModerationRemarks(e.target.value)} placeholder={t("events.detail.moderationPlaceholder")}
                            className="w-full min-h-[90px] px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron resize-none mb-4" />
                        <div className="flex gap-3">
                            <Button onClick={() => handleModeration("APPROVED")} disabled={moderating} className="flex-1">
                                {moderating ? t("events.detail.approving") : t("events.detail.approve")}
                            </Button>
                            <Button variant="danger" onClick={() => handleModeration("REJECTED")} disabled={moderating} className="flex-1">
                                {moderating ? t("events.detail.rejecting") : t("events.detail.reject")}
                            </Button>
                            <Button variant="secondary" onClick={() => toast(t("events.detail.toastComingSoon"), { variant: "info" })}>
                                {t("events.detail.suggestChanges")}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
