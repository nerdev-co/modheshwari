"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Plus, Check, X, Loader2, AlertCircle } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { useToast } from "@repo/ui/toast";

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
      return "bg-jewel-emerald/10 text-jewel-emerald border-jewel-emerald/20";
    case "REJECTED":
      return "bg-jewel-ruby/10 text-jewel-ruby border-jewel-ruby/20";
    case "CHANGES_REQUESTED":
      return "bg-jewel-gold/10 text-jewel-gold border-jewel-gold/20";
    default:
      return "bg-jewel-400/10 text-jewel-600 border-jewel-400/20";
  }
}

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

  if (loading) return <DreamySunsetBackground className="px-6 py-10 flex items-center justify-center"><p className="text-jewel-500">Loading...</p></DreamySunsetBackground>;
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
        toast("Request created successfully", { variant: "success" });
        void fetchRequests();
      } else {
        toast(data.message || "Failed to create request", { variant: "error" });
      }
    } catch {
      toast("Network error", { variant: "error" });
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
        toast("Review submitted", { variant: "success" });
        void fetchRequests();
      } else {
        toast(data.message || "Failed to review", { variant: "error" });
      }
    } catch {
      toast("Network error", { variant: "error" });
    }
  }

  const isAdmin =
    me?.role &&
    ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(me.role);

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-jewel-gold/15 border border-jewel-gold/25">
              <Package className="w-6 h-6 text-jewel-gold" />
            </div>
            <h1 className="text-4xl font-display font-bold text-jewel-900">
              {t("resources.title")}
            </h1>
          </div>
          <p className="text-jewel-500">
            {t("resources.description")}
          </p>
        </motion.div>

        {/* Create Request Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-display font-bold text-jewel-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-jewel-gold" />
              {t("resources.createTitle")}
            </h2>

          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
              <input
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder={t("resources.createPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && resource.trim()) {
                    e.preventDefault();
                    void handleCreate();
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-sm text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/40 focus:border-transparent transition-all"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={!resource.trim()}
            >
              {t("resources.create")}
            </Button>
          </div>
          </Card>
        </motion.section>

        {/* Requests Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-jewel-400/20">
            <h2 className="text-lg font-display font-bold text-jewel-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-jewel-gold" />
              {t("resources.yourRequests")}
              {!loading && requests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-jewel-400/10 text-jewel-600 text-xs rounded-full">
                  {requests.length}
                </span>
              )}
            </h2>
          </div>

          {loadingData ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="w-8 h-8 text-jewel-gold animate-spin" />
              <span className="text-sm text-jewel-500">{t("common.loading")}</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-jewel-100/60 mb-4">
                <Package className="w-8 h-8 text-jewel-400" />
              </div>
              <p className="text-jewel-500 text-sm mb-2">{t("resources.noRequests")}</p>
              <p className="text-jewel-500 text-xs">
                {t("resources.noRequestsDesc")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-sm text-jewel-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-left font-medium">{t("resources.resource")}</th>
                    <th className="px-6 py-4 text-left font-medium">{t("resources.status")}</th>
                    <th className="px-6 py-4 text-left font-medium">{t("resources.approvals")}</th>
                    <th className="px-6 py-4 text-left font-medium">{t("resources.actions")}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-jewel-400/15">
                  {requests.map((r, index) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-jewel-100/40 transition-all duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-jewel-gold/15 border border-jewel-gold/25 flex items-center justify-center">
                            <Package className="w-5 h-5 text-jewel-gold" />
                          </div>
                          <span className="font-medium text-jewel-900">
                            {r.resource}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                            r.status,
                          )}`}
                        >
                          {r.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {r.approvals?.length ? (
                          <div className="space-y-2">
                            {r.approvals.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    a.status === "APPROVED"
                                      ? "bg-jewel-emerald"
                                      : a.status === "REJECTED"
                                        ? "bg-jewel-ruby"
                                        : "bg-jewel-gold"
                                  }`}
                                />
                                <span className="text-jewel-600">
                                  <span className="font-medium text-jewel-800">
                                    {a.approverName}
                                  </span>
                                  {" · "}
                                  <span className="text-jewel-400">
                                    {a.status}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-jewel-400">
                            {t("resources.noApprovals")}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isAdmin ? (
                           <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleReview(r.id, "approve")}
                              className="flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {t("resources.approve")}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReview(r.id, "reject")}
                              className="flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              {t("resources.reject")}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReview(r.id, "changes")}
                              className="flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              {t("resources.changes")}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-jewel-400 italic">
                            {t("resources.awaitingReview")}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </Card>
        </motion.section>
      </div>
    </DreamySunsetBackground>
  );
}
