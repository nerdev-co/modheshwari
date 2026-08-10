"use client";

import React, { useEffect, useState } from "react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { useToast } from "@repo/ui/toast";

import { API_BASE } from "../../lib/config";
import apiFetch from "../../lib/api";

type Event = {
  id: string;
  name: string;
  description?: string;
  date: string;
  venue?: string;
  status: string;
  createdBy: { id: string; name: string; email: string };
  _count: { registrations: number };
  createdAt: string;
};

const fetcher = /**
 * Executes fetcher operation.
 * @param {string} url - Description of url
 * @returns {Promise<any>} Description of return value
 */
async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

/**
 * Performs  events list client operation.
 * @param {{ initialData: Event[]; }} { initialData } - Description of { initialData }
 * @returns {any} Description of return value
 */
export default function EventsListClient({ initialData }: { initialData: Event[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("approved");

  useEffect(() => {
    setHydrated(true);
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
    if (savedToken) {
      try {
        const parts = savedToken.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]!));
          setUserRole(payload.role || payload.userRole || null);
        }
      } catch (_err) {
        void _err;
      }
    }
  }, []);

  const statusParam = filter === "all" ? "" : `?status=${filter.toUpperCase()}`;
  const key = `${API_BASE}/events${statusParam}`;

  const { data, error, isLoading } = useSWR(key, fetcher, { fallbackData: { data: { data: initialData } } });

  const events: Event[] = data?.data?.data || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAdmin = !!(
    userRole && ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(userRole)
  );

  const handleCardModeration = async (
    e: React.MouseEvent,
    id: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    e.stopPropagation();
    if (!token || !isAdmin) return toast("Not authorized", { variant: "warning" });

    const remarks = window.prompt("Optional remarks / suggested changes:", "") || undefined;
    setModeratingId(id);
    try {
      await apiFetch(`${API_BASE}/events/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ status, remarks }),
      });
      mutate(key);
      toast(`Moderation recorded: ${status}`, { variant: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(msg || "Moderation failed", { variant: "error" });
    } finally {
      setModeratingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; classes: string }> = {
      APPROVED: { label: "Approved", classes: "bg-jewel-emerald/15 text-jewel-emerald border-jewel-emerald/30" },
      PENDING: { label: "Pending", classes: "bg-jewel-gold/15 text-jewel-gold border-jewel-gold/30" },
      REJECTED: { label: "Rejected", classes: "bg-jewel-ruby/15 text-jewel-ruby border-jewel-ruby/30" },
      CANCELLED: { label: "Cancelled", classes: "bg-jewel-400/15 text-jewel-600 border-jewel-400/30" },
    };
    return map[status] || { label: status, classes: "bg-jewel-400/15 text-jewel-600 border-jewel-400/30" };
  };

  if (hydrated && !token) return <NotAuthenticated />;
  if (!hydrated) return null;

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-jewel-900 tracking-tight">Events</h1>
            <p className="text-sm text-jewel-500 mt-1">Browse and register for community events</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/events/calendar")}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </Button>
            <Button onClick={() => router.push("/events/create")}>
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[{ label: "Approved", value: "approved" as const }, { label: "Pending", value: "pending" as const }, { label: "All", value: "all" as const }].map((f) => (
            <Button
              key={f.value}
              variant="secondary"
              size="sm"
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.value
                  ? "bg-jewel-gold/15 text-jewel-gold border border-jewel-gold/30"
                  : "text-jewel-500 hover:text-jewel-gold border border-transparent"
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {isLoading || error ? (
          <LoaderOne />
        ) : events.length === 0 ? (
          <div className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 text-jewel-400 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-jewel-900 mb-2">No events found</h3>
            <p className="text-sm text-jewel-500 mb-6">{filter === "approved" ? "No approved events at the moment. Check back later!" : "Try adjusting your filters or create a new event."}</p>
            <Button onClick={() => router.push("/events/create")}>
              <Plus className="w-4 h-4" />
              Create New Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => {
              const status = getStatusConfig(event.status);
              const initial = event.createdBy?.name ? event.createdBy.name.charAt(0).toUpperCase() : "?";
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-6 hover:shadow-jewel-lg transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.classes}`}>
                      {status.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-jewel-500"><Users className="w-3.5 h-3.5" />{event._count.registrations}</span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-jewel-900 mb-2 line-clamp-2">{event.name}</h3>

                  {event.description && <p className="text-sm text-jewel-600 mb-4 line-clamp-2">{event.description}</p>}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-jewel-500"><Calendar className="w-4 h-4 flex-shrink-0" /><span className="truncate">{formatDate(event.date)}</span></div>
                    {event.venue && (<div className="flex items-center gap-2 text-xs text-jewel-500"><MapPin className="w-4 h-4 flex-shrink-0" /><span className="truncate">{event.venue}</span></div>)}
                  </div>

                  <div className="mt-4 pt-4 border-t border-jewel-400/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-jewel-gold/15 border border-jewel-gold/25 flex items-center justify-center text-jewel-deep font-bold">{initial}</div>
                      <p className="text-xs text-jewel-500">Organized by <span className="text-jewel-700 font-medium">{event.createdBy.name}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => handleCardModeration(e, event.id, "APPROVED")}
                            disabled={!!moderatingId}
                            aria-label={`Approve ${event.name}`}
                            className="px-2 py-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => handleCardModeration(e, event.id, "REJECTED")}
                            disabled={!!moderatingId}
                            aria-label={`Reject ${event.name}`}
                            className="px-2 py-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-jewel-400">{new Date(event.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DreamySunsetBackground>
  );
}
