"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { LoadingState } from "@repo/ui/loadingState";
import { useToast } from "@repo/ui/toast";
import { formatBloodGroup, toBloodGroupEnum, BLOOD_GROUPS } from "@modheshwari/utils/format";

import { API_BASE } from "../../lib/config";
import apiFetch from "../../lib/api";
import { useUser } from "../../lib/UserContext";
import { useLocale } from "../../lib/LocaleContext";

interface MedicalInfo {
  userId: string;
  name: string;
  email: string;
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
}

/**
 * Performs  medical operation.
 * @returns {any} Description of return value
 */
export default function Medical() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useUser();
  const { t } = useLocale();

  const myProfile = user?.profile ?? null;
  const [medicalList, setMedicalList] = useState<MedicalInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  async function fetchMedicalInfo(query: string) {
    if (!query.trim()) {
      setMedicalList([]);
      return;
    }

    setSearchLoading(true);

    try {
      const enumFormat = toBloodGroupEnum(query);

      const data = await apiFetch(
        `${API_BASE}/medical/search?bloodGroup=${encodeURIComponent(enumFormat)}`,
        { throwOnError: false },
      );
      if (data.status === "success") {
        setMedicalList(data.data || []);
      } else {
        setMedicalList([]);
        toast(data.message || t("medical.noResults"), { variant: "info" });
      }
    } catch {
      setMedicalList([]);
      toast(t("medical.records.toastSearchFailed"), { variant: "error" });
    } finally {
      setSearchLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <LoadingState message={t("common.loading")} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p className="text-ink-muted">No user data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-ink mb-1">{t("medical.title")}</h1>
          <p className="text-sm text-ink-muted">{t("medical.welcome").replace("{{name}}", user.name)}</p>
        </div>

        {/* My Medical Info Card */}
        <Card className="p-5 mb-8">
          <h2 className="text-lg font-display font-bold text-ink mb-4">{t("medical.myInfo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-ink-muted mb-1">{t("medical.bloodGroup")}</p>
              <p className="text-sm font-medium text-ink">
                {formatBloodGroup(myProfile?.bloodGroup)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted mb-1">{t("medical.allergies")}</p>
              <p className="text-sm font-medium text-ink">
                {myProfile?.allergies || t("medical.noneRecorded")}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted mb-1">{t("medical.medicalNotes")}</p>
              <p className="text-sm font-medium text-ink">
                {myProfile?.medicalNotes || t("medical.noneRecorded")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/me/edit")}
            className="mt-4 justify-start"
          >
            {t("medical.updateInfo")}
          </Button>
        </Card>

        {/* Search Card */}
        <Card className="p-5 mb-8">
          <label htmlFor="medical-search" className="block text-sm text-ink-secondary font-medium mb-2">
            {t("medical.searchTitle")}
          </label>
          <p className="text-xs text-ink-muted mb-3">
            {t("medical.searchDesc")}
          </p>

          <div className="flex gap-3">
            <input
              id="medical-search"
              type="text"
              placeholder={t("medical.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchMedicalInfo(searchQuery);
              }}
              className="flex-grow bg-surface border border-ink-muted/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 text-ink"
            />

            <Button
              onClick={() => fetchMedicalInfo(searchQuery)}
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? t("medical.searching") : t("medical.search")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {BLOOD_GROUPS.map((bg) => (
              <Button
                key={bg}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery(bg);
                  fetchMedicalInfo(bg);
                }}
                className="px-3 py-1 text-xs rounded-full bg-surface hover:bg-surface border border-ink-muted/20 transition text-ink-secondary"
              >
                {bg}
              </Button>
            ))}
          </div>
        </Card>

        {/* Results Card */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-muted/20">
            <h2 className="text-lg font-display font-bold text-ink">
              {t("medical.results")}
              {medicalList.length > 0 && (
                <span className="ml-2 text-sm text-ink-muted font-normal">
                  ({medicalList.length} users)
                </span>
              )}
            </h2>
          </div>

          {medicalList.length === 0 ? (
            <div className="text-center text-ink-muted py-10 text-sm">
              {searchQuery
                ? t("medical.noResultsFound")
                : t("medical.noResults")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">{t("medical.name")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("medical.email")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("medical.bloodGroup")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("medical.allergies")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("medical.notes")}</th>
                  </tr>
                </thead>

                <tbody>
                  {medicalList.map((m) => (
                    <tr
                      key={m.userId}
                      className="border-t border-ink-muted/15 hover:bg-surface/40 transition"
                    >
                      <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                      <td className="px-4 py-3 text-ink-secondary">{m.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-ruby/10 text-ruby text-xs font-medium border border-ruby/20">
                          {formatBloodGroup(m.bloodGroup)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {m.allergies || t("medical.noneRecorded")}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary max-w-xs truncate">
                        {m.medicalNotes || t("medical.noneRecorded")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
