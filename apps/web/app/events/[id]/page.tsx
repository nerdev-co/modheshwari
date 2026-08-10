"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

import apiFetch from "../../../lib/api";
import { API_BASE } from "../../../lib/config";

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
    const router = useRouter();
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
            toast(msg || "Failed to register for event", { variant: "error" });
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
            toast(msg || "Failed to unregister from event", { variant: "error" });
        } finally {
            setRegistering(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config = {
            APPROVED: {
                icon: CheckCircle,
                color: "bg-jewel-emerald/15 text-jewel-emerald border-jewel-emerald/30",
                label: "Approved",
            },
            PENDING: {
                icon: Clock,
                color: "bg-jewel-gold/15 text-jewel-gold border-jewel-gold/30",
                label: "Pending Approval",
            },
            REJECTED: {
                icon: XCircle,
                color: "bg-jewel-ruby/15 text-jewel-ruby border-jewel-ruby/30",
                label: "Rejected",
            },
            CANCELLED: {
                icon: XCircle,
                color: "bg-jewel-400/15 text-jewel-600 border-jewel-400/30",
                label: "Cancelled",
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
        if (!token) return toast("You must be signed in as an admin to moderate.", { variant: "warning" });

        setModerating(true);
        try {
            await apiFetch(`${API_BASE}/events/${eventId}/approve`, {
                method: "POST",
                body: JSON.stringify({ status, remarks: moderationRemarks }),
            });

            setModerationRemarks("");
            await fetchEvent();
            toast(`Moderation recorded: ${status}`, { variant: "success" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toast(msg || "Moderation failed", { variant: "error" });
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

    if (loading) return <LoaderOne />;

    if (!event) {
        return (
            <DreamySunsetBackground className="px-6 py-10 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-jewel-900 mb-2">Event not found</h2>
                    <Button variant="ghost" onClick={() => router.push("/events")}>
                        Back to Events
                    </Button>
                </div>
            </DreamySunsetBackground>
        );
    }

    return (
        <DreamySunsetBackground className="px-6 py-10">
            <div className="max-w-5xl mx-auto">
                <div className="bg-jewel-50/80 backdrop-blur-xl rounded-3xl border border-jewel-400/20 shadow-jewel p-5 md:p-8">
                    {/* Header */}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Events
                    </Button>

                    {/* Event Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-jewel-50/60 backdrop-blur-xl border border-jewel-400/20 shadow-jewel p-6 md:p-8"
                    >
                        {/* Status & Registration Count */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            {getStatusBadge(event.status)}
                            <span className="flex items-center gap-2 text-jewel-500">
                                <Users className="w-5 h-5" />
                                <span className="font-semibold text-jewel-800">
                                    {event._count.registrations}
                                </span>
                                <span className="text-sm">registered</span>
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
                                    <p className="text-xs text-jewel-400 mb-1">Date & Time</p>
                                    <p className="text-sm font-medium text-jewel-800">
                                        {formatDate(event.date)}
                                    </p>
                                </div>
                            </div>

                            {event.venue && (
                                <div className="flex items-start gap-3 p-4 bg-jewel-100/40 rounded-xl border border-jewel-400/20">
                                    <MapPin className="w-5 h-5 text-jewel-gold flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-jewel-400 mb-1">Venue</p>
                                        <p className="text-sm font-medium text-jewel-800">{event.venue}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Organizer */}
                        <div className="p-5 bg-jewel-100/40 rounded-xl border border-jewel-400/20 mb-8">
                            <p className="text-xs text-jewel-400 mb-2">Organized by</p>
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
                                                Unregistering...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <UserX className="w-5 h-5" />
                                                Unregister
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
                                                Registering...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <UserCheck className="w-5 h-5" />
                                                Register for Event
                                            </span>
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}

                        {event.status === "PENDING" && (
                            <div className="p-4 rounded-xl bg-jewel-gold/10 border border-jewel-gold/30 text-jewel-700 text-sm">
                                <strong>Pending Approval:</strong> This event is awaiting
                                approval from community admins.
                            </div>
                        )}

                        {event.status === "REJECTED" && (
                            <div className="p-4 rounded-xl bg-jewel-ruby/10 border border-jewel-ruby/30 text-jewel-ruby text-sm">
                                <strong>Rejected:</strong> This event was not approved by the
                                admins.
                            </div>
                        )}

                        {event.status === "CANCELLED" && (
                            <div className="p-4 rounded-xl bg-jewel-400/10 border border-jewel-400/30 text-jewel-600 text-sm">
                                <strong>Cancelled:</strong> This event has been cancelled.
                            </div>
                        )}
                    </motion.div>

                    {/* Approval Status */}
                    {event.approvals && event.approvals.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-6 rounded-2xl bg-jewel-50/60 backdrop-blur-xl border border-jewel-400/20 p-6"
                        >
                            <h2 className="text-xl font-display font-bold text-jewel-900 mb-4">Approval Status</h2>
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
                        </motion.div>
                    )}

                    {/* Moderation Area */}
                    {isAdmin && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="mt-6 bg-jewel-100/60 backdrop-blur-xl border border-jewel-400/20 rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-display font-bold text-jewel-900 mb-3">Moderation</h2>
                            <p className="text-sm text-jewel-500 mb-4">
                                You can approve or reject this event, or suggest changes. Your
                                action will be recorded.
                            </p>

                            <textarea
                                value={moderationRemarks}
                                onChange={(e) => setModerationRemarks(e.target.value)}
                                placeholder="Optional remarks / suggested changes"
                                className="w-full min-h-[90px] p-4 rounded-xl bg-jewel-50/50 border border-jewel-400/30 text-sm text-jewel-800 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent mb-4 resize-none"
                            />

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleModeration("APPROVED")}
                                    disabled={moderating}
                                    className="flex-1"
                                >
                                    {moderating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader className="w-4 h-4 animate-spin" /> Approving...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Approve
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
                                            <Loader className="w-4 h-4 animate-spin" /> Rejecting...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <XCircle className="w-4 h-4" /> Reject
                                        </span>
                                    )}
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        toast("Event editing coming soon. Contact an admin for changes.", { variant: "info" });
                                    }}
                                >
                                    Suggest Changes
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </DreamySunsetBackground>
    );
}
