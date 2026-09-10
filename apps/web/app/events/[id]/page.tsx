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
    Loader,
    UserCheck,
    UserX,
} from "lucide-react";
import { LoadingState } from "@repo/ui/loadingState";
import { EmptyState } from "@repo/ui/emptyState";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

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
                color: "bg-jewel-emerald/15 text-jewel-emerald border-jewel-emerald/30",
                label: t("events.detail.statusApproved"),
            },
            PENDING: {
                icon: Clock,
                color: "bg-jewel-gold/15 text-jewel-gold border-jewel-gold/30",
                label: t("events.detail.statusPending"),
            },
            REJECTED: {
                icon: XCircle,
                color: "bg-jewel-ruby/15 text-jewel-ruby border-jewel-ruby/30",
                label: t("events.detail.statusRejected"),
            },
            CANCELLED: {
                icon: XCircle,
                color: "bg-jewel-400/15 text-jewel-600 border-jewel-400/30",
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
            <DreamySunsetBackground className="px-6 py-10 flex items-center justify-center">
                <EmptyState
                    title={t("events.detail.notFound")}
                    action={{
                        label: t("events.detail.backToEvents"),
                        onClick: () => navigate("/events"),
                    }}
                />
            </DreamySunsetBackground>
        );
    }

    return (
        <DreamySunsetBackground className="px-6 py-10">
            <div className="max-w-5xl mx-auto">
                {/* Event Details */}
                <div className="p-5 md:p-8 bg-surface rounded-2xl border border-border">
                    {/* Header */}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("events.detail.backToEvents")}
                    </Button>

                    {/* Event Card */}
                    <div className="p-6 md:p-8">
                        {/* Status & Registration Count */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            {getStatusBadge(event.status)}
                            <span className="flex items-center gap-2 text-jewel-500">
                                <Users className="w-5 h-5" />
                                <span className="font-semibold text-jewel-800">
                                    {event._count.registrations}
                                </span>
                                <span className="text-sm">{t("events.detail.registered")}</span>
                            </span>
                        </div>

                        {/* Event Name */}
                        <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-3 text-jewel-900">
                            {event.name}
                        </h1>

                        {/* Description */}
                        {event.description && (
                            <p className="text-jewel-600 mb-7 leading-relaxed text-[15px]">
                                {event.description}
                            </p>
                        )}

                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-start gap-3 p-4 bg-jewel-100/40 rounded-xl border border-jewel-400/20">
                                <Calendar className="w-5 h-5 text-jewel-gold flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-jewel-400 mb-1">{t("events.detail.dateTime")}</p>
                                    <p className="text-sm font-medium text-jewel-800">
                                        {formatDate(event.date)}
                                    </p>
                                </div>
                            </div>

                            {event.venue && (
                                <div className="flex items-start gap-3 p-4 bg-jewel-100/40 rounded-xl border border-jewel-400/20">
                                    <MapPin className="w-5 h-5 text-jewel-gold flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-jewel-400 mb-1">{t("events.detail.venue")}</p>
                                        <p className="text-sm font-medium text-jewel-800">{event.venue}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Organizer */}
                        <div className="p-5 bg-jewel-100/40 rounded-xl border border-jewel-400/20 mb-8">
                            <p className="text-xs text-jewel-400 mb-2">{t("events.detail.organizedBy")}</p>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-jewel-200/60 border border-jewel-400/20 flex items-center justify-center text-jewel-800 font-bold">
                                    {event.createdBy.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-jewel-900">{event.createdBy.name}</p>
                                    <p className="text-xs text-jewel-400">{event.createdBy.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Registration Button */}
                        {event.status === "APPROVED" && (
                            <div className="flex gap-3">
                                {isRegistered ? (
                                    <Button
                                        variant="danger"
                                        onClick={handleUnregister}
                                        disabled={registering}
                                        className="flex-1"
                                    >
                                        {registering ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader className="w-5 h-5 animate-spin" />
                                                {t("events.detail.unregistering")}
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <UserX className="w-5 h-5" />
                                                {t("events.detail.unregister")}
                                            </span>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleRegister}
                                        disabled={registering}
                                        className="flex-1"
                                    >
                                        {registering ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader className="w-5 h-5 animate-spin" />
                                                {t("events.detail.registering")}
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <UserCheck className="w-5 h-5" />
                                                {t("events.detail.registerForEvent")}
                                            </span>
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}

                        {event.status === "PENDING" && (
                            <div className="p-4 rounded-xl bg-jewel-gold/10 border border-jewel-gold/30 text-jewel-700 text-sm">
                                <strong>{t("events.detail.pendingApprovalLabel")}</strong> {t("events.detail.pendingApprovalMessage")}
                            </div>
                        )}

                        {event.status === "REJECTED" && (
                            <div className="p-4 rounded-xl bg-jewel-ruby/10 border border-jewel-ruby/30 text-jewel-ruby text-sm">
                                <strong>{t("events.detail.rejectedLabel")}</strong> {t("events.detail.rejectedMessage")}
                            </div>
                        )}

                        {event.status === "CANCELLED" && (
                            <div className="p-4 rounded-xl bg-jewel-400/10 border border-jewel-400/30 text-jewel-600 text-sm">
                                <strong>{t("events.detail.cancelledLabel")}</strong> {t("events.detail.cancelledMessage")}
                            </div>
                        )}
                    </div>

                    {/* Approval Status */}
                    {event.approvals && event.approvals.length > 0 && (
                        <div className="mt-6 p-6 bg-surface-muted rounded-2xl">
                            <h2 className="text-xl font-display font-bold text-jewel-900 mb-4">{t("events.detail.approvalStatus")}</h2>
                            <div className="space-y-3">
                                {event.approvals.map((approval) => (
                                    <div
                                        key={approval.id}
                                        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-jewel-100/40 border border-jewel-400/20"
                                    >
                                        <div>
                                            <p className="font-medium text-jewel-900">{approval.approver.name}</p>
                                            <p className="text-xs text-jewel-500">
                                                {approval.approver.role.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${approval.status === "APPROVED"
                                                    ? "bg-jewel-emerald/15 text-jewel-emerald"
                                                    : approval.status === "REJECTED"
                                                        ? "bg-jewel-ruby/15 text-jewel-ruby"
                                                        : "bg-jewel-gold/15 text-jewel-gold"
                                                }`}
                                        >
                                            {approval.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Moderation Area */}
                    {isAdmin && (
                        <div className="mt-6 bg-surface-muted rounded-2xl p-6">
                            <h2 className="text-lg font-display font-bold text-jewel-900 mb-3">{t("events.detail.moderation")}</h2>
                            <p className="text-sm text-jewel-500 mb-4">
                                {t("events.detail.moderationDescription")}
                            </p>

                            <textarea
                                value={moderationRemarks}
                                onChange={(e) => setModerationRemarks(e.target.value)}
                                placeholder={t("events.detail.moderationPlaceholder")}
                                className="w-full min-h-[90px] p-4 rounded-xl bg-jewel-50/50 border border-jewel-400/30 text-sm text-jewel-800 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent mb-4 resize-none"
                            />

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleModeration("APPROVED")}
                                    disabled={moderating}
                                    className="flex-1"
                                >
                                    {moderating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader className="w-4 h-4 animate-spin" /> {t("events.detail.approving")}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> {t("events.detail.approve")}
                                        </span>
                                    )}
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={() => handleModeration("REJECTED")}
                                    disabled={moderating}
                                    className="flex-1"
                                >
                                    {moderating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader className="w-4 h-4 animate-spin" /> {t("events.detail.rejecting")}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <XCircle className="w-4 h-4" /> {t("events.detail.reject")}
                                        </span>
                                    )}
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        toast(t("events.detail.toastComingSoon"), { variant: "info" });
                                    }}
                                >
                                    {t("events.detail.suggestChanges")}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DreamySunsetBackground>
    );
}
