"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderFour } from "@repo/ui/loading";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";

import apiFetch from "../../lib/api";
import { API_BASE } from "../../lib/config";
import { useLocale } from "../../lib/LocaleContext";

interface NearbyUser {
  id: string;
  name: string;
  phone: string | null;
  locationLat: number | null;
  locationLng: number | null;
  distanceKm: number;
}

/**
 * Performs  meta operation.
 * @param {{ label: string; value: string; }} { label, value } - Description of { label, value }
 * @returns {React.JSX.Element} Description of return value
 */
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 border border-jewel-400/20 rounded-xl bg-jewel-50/50">
      <div className="text-xs text-jewel-400">{label}</div>
      <div className="font-medium text-jewel-800">{value}</div>
    </div>
  );
}

/**
 * Performs  nearby page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function NearbyPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/signin");
      return;
    }

    const controller = new AbortController();

    async function fetchNearby() {
      try {
        setLoading(true);
        setError(null);

        const resp = await apiFetch(
          `${API_BASE}/users/nearby?radiusKm=${radiusKm}`,
          { throwOnError: false, signal: controller.signal },
        );
        const data = resp && (resp.ok === false ? resp.data : resp);

        if (Array.isArray(data)) {
          setUsers(data as NearbyUser[]);
        } else if (data && Array.isArray(data.data)) {
          setUsers(data.data as NearbyUser[]);
        } else {
          const msg =
            (data && (data.error || data.message)) ||
            "Failed to fetch nearby users";
          throw new Error(msg);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch nearby users",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchNearby();
    return () => controller.abort();
  }, [radiusKm, navigate]);

  if (loading) {
    return (
      <DreamySunsetBackground className="flex items-center justify-center min-h-screen">
        <LoaderFour text={t("nearby.findingMembers")} />
      </DreamySunsetBackground>
    );
  }

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <section className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-6">
          <h1 className="text-2xl font-display font-bold text-jewel-900">{t("nearby.title")}</h1>
          <p className="text-sm text-jewel-500 mt-1">
            {t("nearby.description")}
          </p>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-jewel-500">{t("nearby.searchRadius")}</span>
              <span className="font-medium text-jewel-800">{radiusKm} km</span>
            </div>

            <input
              type="range"
              min={1}
              max={50}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-jewel-gold"
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <section className="mt-6 border border-jewel-ruby/30 bg-jewel-ruby/10 text-jewel-ruby rounded-xl p-4 text-sm">
            {error}
          </section>
        )}

        {/* Empty */}
        {!error && users.length === 0 && (
          <section className="mt-6 border border-jewel-400/20 rounded-xl p-6 text-sm text-jewel-500 bg-jewel-50/60">
            {t("nearby.noMembers")}
          </section>
        )}

        {/* List */}
        <section className="mt-6 space-y-4">
          {users.map((u) => {
            const initials = u.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={u.id}
                className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-6 flex gap-4 items-center"
              >
                <div className="h-14 w-14 rounded-full bg-jewel-gold/20 text-jewel-deep flex items-center justify-center font-semibold">
                  {initials}
                </div>

                <div className="flex-1">
                  <h2 className="font-display font-semibold text-jewel-900">{u.name}</h2>

                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <Meta label={t("nearby.distance")} value={`${u.distanceKm} km`} />
                    {u.phone && <Meta label={t("nearby.phone")} value={u.phone} />}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </DreamySunsetBackground>
  );
}
