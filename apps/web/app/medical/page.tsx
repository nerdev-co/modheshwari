"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
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
        toast(data.message || "No users found", { variant: "info" });
      }
    } catch {
      setMedicalList([]);
      toast("Failed to search medical records", { variant: "error" });
    } finally {
      setSearchLoading(false);
    }
  }

  if (loading) {
    return (
      <DreamySunsetBackground className="px-6 py-10 flex items-center justify-center">
        <LoadingState message="Loading user info..." />
      </DreamySunsetBackground>
    );
  }

  if (!user) {
    return (
      <DreamySunsetBackground className="px-6 py-10 flex items-center justify-center">
        <p className="text-jewel-500">No user data available</p>
      </DreamySunsetBackground>
    );
  }

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-jewel-900 mb-1">{t("medical.title")}</h1>
          <p className="text-sm text-jewel-500">{t("medical.welcome").replace("{{name}}", user.name)}</p>
        </div>

        {/* My Medical Info Card */}
        <Card className="p-5 mb-8">
          <h2 className="text-lg font-display font-bold text-jewel-900 mb-4">{t("medical.myInfo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-jewel-400 mb-1">{t("medical.bloodGroup")}</p>
              <p className="text-sm font-medium text-jewel-800">
                {formatBloodGroup(myProfile?.bloodGroup)}
              </p>
            </div>
            <div>
              <p className="text-xs text-jewel-400 mb-1">{t("medical.allergies")}</p>
              <p className="text-sm font-medium text-jewel-800">
                {myProfile?.allergies || t("medical.noneRecorded")}
              </p>
            </div>
            <div>
              <p className="text-xs text-jewel-400 mb-1">{t("medical.medicalNotes")}</p>
              <p className="text-sm font-medium text-jewel-800">
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
          <label className="block text-sm text-jewel-700 font-medium mb-2">
            {t("medical.searchTitle")}
          </label>
          <p className="text-xs text-jewel-400 mb-3">
            {t("medical.searchDesc")}
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t("medical.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchMedicalInfo(searchQuery);
              }}
              className="flex-grow bg-jewel-50/50 border border-jewel-400/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 text-jewel-900"
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
                className="px-3 py-1 text-xs rounded-full bg-jewel-50/60 hover:bg-jewel-100 border border-jewel-400/20 transition text-jewel-700"
              >
                {bg}
              </Button>
            ))}
          </div>
        </Card>

        {/* Results Card */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-jewel-400/20">
            <h2 className="text-lg font-display font-bold text-jewel-900">
              {t("medical.results")}
              {medicalList.length > 0 && (
                <span className="ml-2 text-sm text-jewel-500 font-normal">
                  ({medicalList.length} users)
                </span>
              )}
            </h2>
          </div>

          {medicalList.length === 0 ? (
            <div className="text-center text-jewel-500 py-10 text-sm">
              {searchQuery
                ? t("medical.noResultsFound")
                : t("medical.noResults")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-jewel-100/60 text-jewel-600">
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
                      className="border-t border-jewel-400/15 hover:bg-jewel-100/40 transition"
                    >
                      <td className="px-4 py-3 font-medium text-jewel-900">{m.name}</td>
                      <td className="px-4 py-3 text-jewel-600">{m.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-jewel-ruby/10 text-jewel-ruby text-xs font-medium border border-jewel-ruby/20">
                          {formatBloodGroup(m.bloodGroup)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-jewel-700">
                        {m.allergies || "None"}
                      </td>
                      <td className="px-4 py-3 text-jewel-600 max-w-xs truncate">
                        {m.medicalNotes || "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DreamySunsetBackground>
  );
}
