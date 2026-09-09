"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Check, X, Loader2, AlertCircle } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

import { API_BASE } from "../../lib/config";
import apiFetch from "../../lib/api";
import { useUser } from "../../lib/UserContext";

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
 * Performs get status color operation.
 * @param {string} status - Description of status
 * @returns {string} Description of return value
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

/**
 * Performs  resource requests page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function ResourceRequestsPage(): React.JSX.Element {
  const { toast } = useToast();
  const { user: me } = useUser();
  const [resource, setResource] = useState("");
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchRequests(controller.signal);
    return () => controller.abort();
  }, [fetchRequests]);

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
              Resource Requests
            </h1>
          </div>
          <p className="text-jewel-500">
            Request, track, and review shared resources
          </p>
        </motion.div>

        {/* Create Request Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-display font-bold text-jewel-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-jewel-gold" />
            Create New Request
          </h2>

          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
              <input
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="What resource do you need?"
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
              Create
            </Button>
          </div>
        </motion.section>

        {/* Requests Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-jewel-400/20">
            <h2 className="text-lg font-display font-bold text-jewel-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-jewel-gold" />
              Your Requests
              {!loading && requests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-jewel-400/10 text-jewel-600 text-xs rounded-full">
                  {requests.length}
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="w-8 h-8 text-jewel-gold animate-spin" />
              <span className="text-sm text-jewel-400">Loading requests...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-jewel-100/60 mb-4">
                <Package className="w-8 h-8 text-jewel-400" />
              </div>
              <p className="text-jewel-500 text-sm mb-2">No requests found</p>
              <p className="text-jewel-400 text-xs">
                Create your first request to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-sm text-jewel-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-left font-medium">Resource</th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-medium">Approvals</th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
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
                            No approvals yet
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
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReview(r.id, "reject")}
                              className="flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReview(r.id, "changes")}
                              className="flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Changes
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-jewel-400 italic">
                            Awaiting review
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </div>
    </DreamySunsetBackground>
  );
}
