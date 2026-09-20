"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { useNavigate } from "react-router-dom";
import useSWR, { mutate } from "swr";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { LoaderOne } from "@repo/ui/loading";
import { EmptyState } from "@repo/ui/emptyState";
import { ErrorState } from "@repo/ui/errorState";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { useToast } from "@repo/ui/toast";
import { motion } from "framer-motion";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import { API_BASE } from "../../lib/config";
import apiFetch from "../../lib/api";
import { useLocale } from "../../lib/LocaleContext";

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
 */
async (url: string) => {
  const res = await apiFetch(url, { throwOnError: false });
  if (res?.ok === false) throw new Error("Failed to fetch");
  return res;
};

/**
 * Performs  events list client operation.
 * @returns {any} Description of return value
 */
export default function EventsListClient() {
  const { t } = useLocale();
  const navigate = useNavigate();
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

  const { data, error, isLoading } = useSWR(key, fetcher);

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
    if (!token || !isAdmin) return toast(t("events.list.toastNotAuthorized"), { variant: "warning" });

    const remarks = window.prompt(t("events.list.moderationPrompt"), "") || undefined;
    setModeratingId(id);
    try {
      await apiFetch(`${API_BASE}/events/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ status, remarks }),
      });
      mutate(key);
      toast(t("events.list.toastModerationRecorded", { status }), { variant: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(msg || t("events.list.toastModerationFailed"), { variant: "error" });
    } finally {
      setModeratingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; classes: string }> = {
      APPROVED: { label: t("events.list.statusApproved"), classes: "text-emerald border-emerald/30" },
      PENDING: { label: t("events.list.statusPending"), classes: "text-saffron border-saffron/30" },
      REJECTED: { label: t("events.list.statusRejected"), classes: "text-ruby border-ruby/30" },
      CANCELLED: { label: t("events.list.statusCancelled"), classes: "text-ink-muted border-border" },
    };
    return map[status] || { label: status, classes: "text-ink-muted border-border" };
  };

  if (hydrated && !token) return <NotAuthenticated />;
  if (!hydrated) return null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION_PAGE_ENTER}
          className="mb-14"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-display font-semibold leading-tight text-ink">{t("events.list.title")}</h1>
              <p className="text-body-lg text-ink-secondary mt-1">{t("events.list.description")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/events/calendar")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-muted rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {t("events.list.calendar")}
              </button>
              <button
                onClick={() => navigate("/events/create")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-saffron hover:bg-saffron/90 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("events.list.create")}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="h-px bg-border" />

        <div className="py-10">
          <div className="flex gap-1 mb-8">
            {[{ label: t("events.list.filterApproved"), value: "approved" as const }, { label: t("events.list.filterPending"), value: "pending" as const }, { label: t("events.list.filterAll"), value: "all" as const }].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === f.value
                    ? "bg-saffron/10 text-saffron"
                    : "text-ink-muted hover:text-ink hover:bg-surface-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><LoaderOne /></div>
          ) : error ? (
            <ErrorState message={error.message} onRetry={() => mutate(key)} />
          ) : events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={t("events.list.noEvents")}
              description={filter === "approved" ? t("events.list.noApprovedEvents") : t("events.list.adjustFilters")}
              action={{ label: t("events.list.createNewEvent"), onClick: () => navigate("/events/create") }}
            />
          ) : (
            <div className="space-y-0">
              {events.map((event) => {
                const status = getStatusConfig(event.status);
                const initial = event.createdBy?.name ? event.createdBy.name.charAt(0).toUpperCase() : "?";
                const eventDate = new Date(event.date);
                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="flex items-start justify-between py-5 border-b border-border-subtle last:border-0 cursor-pointer hover:bg-surface transition-colors -mx-2 px-2"
                  >
                    <div className="flex items-start gap-5 min-w-0">
                      <div className="text-center flex-shrink-0 w-10">
                        <p className="font-display text-heading-sm font-semibold leading-none text-ink">
                          {eventDate.getDate()}
                        </p>
                        <p className="text-caption font-semibold uppercase tracking-wider text-ink-muted mt-0.5">
                          {eventDate.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-body-lg font-semibold text-ink truncate">{event.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 text-caption font-medium border ${status.classes}`}>
                            {status.label}
                          </span>
                        </div>
                        {event.description && <p className="text-body text-ink-muted line-clamp-1">{event.description}</p>}
                        <div className="flex items-center gap-4 mt-1.5 text-caption text-ink-muted">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(event.date)}</span>
                          {event.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>}
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event._count.registrations}</span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                        <Button variant="primary" size="sm" onClick={(e) => handleCardModeration(e, event.id, "APPROVED")} disabled={!!moderatingId} className="px-2 py-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="danger" size="sm" onClick={(e) => handleCardModeration(e, event.id, "REJECTED")} disabled={!!moderatingId} className="px-2 py-1">
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
