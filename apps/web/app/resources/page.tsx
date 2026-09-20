"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Check, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { LoadingState } from "@repo/ui/loadingState";
import { useToast } from "@repo/ui/toast";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import { API_BASE } from "../../lib/config";
import apiFetch from "../../lib/api";
import { useUser } from "../../lib/UserContext";
import { useLocale } from "../../lib/LocaleContext";

interface ResourceRequest {
  id: string;
  resource: string;
  status: string;
  createdAt: string;
  approvals?: Approval[];
  userId?: string;
}

interface Approval {
  id: string;
  approverId: string;
  approverName: string;
  status: string;
  remarks?: string;
  reviewedAt?: string;
}

/**
 * @param {string} status - Description of status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "text-emerald border-emerald/30";
    case "REJECTED":
      return "text-ruby border-ruby/30";
    case "CHANGES_REQUESTED":
      return "text-saffron border-saffron/30";
    default:
      return "text-ink-muted border-border";
  }
}

/**
 * Performs  resource requests page operation.
 * @returns {any} Description of return value
 */
export default function ResourceRequestsPage(): React.JSX.Element | null {
  const { toast } = useToast();
  const { user: me, loading } = useUser();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [resource, setResource] = useState("");
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const fetchRequests = useCallback(async (signal?: AbortSignal) => {
    setLoadingData(true);
    try {
      const res = await apiFetch(`${API_BASE}/resource-requests`, {
        throwOnError: false,
        signal,
      });
      if (res.ok === false) {
        setRequests([]);
        return;
      }
      const json = res.data ?? res;
      setRequests(json.data?.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchRequests(controller.signal);
    return () => controller.abort();
  }, [fetchRequests]);

  useEffect(() => {
    if (!loading && !me) navigate("/signin");
  }, [me, loading, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingState message={t("common.loading")} />
    </div>
  );
  if (!me) return null;

  async function handleCreate(): Promise<void> {
    try {
      const data = await apiFetch(`${API_BASE}/resource-requests`, {
        method: "POST",
        body: JSON.stringify({ resource }),
        throwOnError: false,
      });

      if (data.status === "success") {
        setResource("");
        toast(t("resources.toastCreated"), { variant: "success" });
        void fetchRequests();
      } else {
        toast(data.message || t("resources.createError"), { variant: "error" });
      }
    } catch {
      toast(t("resources.toastNetworkError"), { variant: "error" });
    }
  }

  async function handleReview(
    id: string,
    action: "approve" | "reject" | "changes",
  ): Promise<void> {
    try {
      const data = await apiFetch(
        `${API_BASE}/resource-requests/${id}/review`,
        {
          method: "POST",
          body: JSON.stringify({ action }),
          throwOnError: false,
        },
      );

      if (data.status === "success") {
        toast(t("resources.toastReviewSubmitted"), { variant: "success" });
        void fetchRequests();
      } else {
        toast(data.message || t("resources.toastReviewFailed"), { variant: "error" });
      }
    } catch {
      toast(t("resources.toastNetworkError"), { variant: "error" });
    }
  }

  const isAdmin =
    me?.role &&
    ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(me.role);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION_PAGE_ENTER} className="mb-14">
          <h1 className="font-display text-display font-semibold leading-tight text-ink">{t("resources.title")}</h1>
          <p className="text-body-lg text-ink-secondary mt-1">{t("resources.description")}</p>
        </motion.div>

        <div className="h-px bg-border" />

        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }} className="py-10">
          <h2 className="text-heading-sm font-semibold text-ink mb-6">{t("resources.createTitle")}</h2>
          <div className="flex gap-3">
            <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder={t("resources.createPlaceholder")}
              onKeyDown={(e) => { if (e.key === "Enter" && resource.trim()) { e.preventDefault(); void handleCreate(); } }}
              className="flex-1 px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron" />
            <Button onClick={handleCreate} disabled={!resource.trim()}>{t("resources.create")}</Button>
          </div>
        </motion.section>

        <div className="h-px bg-border" />

        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }} className="py-10">
          <h2 className="text-heading-sm font-semibold text-ink mb-6">{t("resources.yourRequests")}</h2>

          {loadingData ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-8 h-8 text-ink-muted mx-auto mb-3" />
              <p className="text-body text-ink-muted">{t("resources.noRequests")}</p>
              <p className="text-body text-ink-muted mt-1">{t("resources.noRequestsDesc")}</p>
            </div>
          ) : (
            <div className="space-y-0">
              {requests.map((r) => (
                <div key={r.id} className="py-5 border-b border-border-subtle last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-lg font-medium text-ink">{r.resource}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-caption font-medium border px-2 py-0.5 ${getStatusColor(r.status)}`}>{r.status.replaceAll("_", " ")}</span>
                        <span className="text-caption text-ink-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.approvals?.length ? (
                        <div className="mt-3 space-y-1">
                          {r.approvals.map((a) => (
                            <div key={a.id} className="flex items-center gap-2 text-caption">
                              <div className={`h-1.5 w-1.5 rounded-full ${a.status === "APPROVED" ? "bg-emerald" : a.status === "REJECTED" ? "bg-ruby" : "bg-saffron"}`} />
                              <span className="text-ink-muted"><span className="text-ink font-medium">{a.approverName}</span> · {a.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-caption text-ink-muted mt-2">{t("resources.noApprovals")}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="primary" size="sm" onClick={() => handleReview(r.id, "approve")}><Check className="w-3 h-3" /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleReview(r.id, "reject")}><X className="w-3 h-3" /></Button>
                        <Button variant="secondary" size="sm" onClick={() => handleReview(r.id, "changes")}><AlertCircle className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
