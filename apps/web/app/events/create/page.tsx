"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { Button } from "@repo/ui/button";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import apiFetch from "../../../lib/api";
import { useLocale } from "../../../lib/LocaleContext";

export default function CreateEventPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    venue: "",
  });

  const API_BASE = "/api";

  useEffect(() => {
    setHydrated(true);
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch(`${API_BASE}/events`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      navigate("/events");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (hydrated && !token) return <NotAuthenticated />;
  if (!hydrated) return null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[640px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION_PAGE_ENTER}
          className="mb-14"
        >
          <button onClick={() => navigate(-1)} className="text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-6">
            <ArrowLeft className="h-3 w-3" />
            {t("events.create.back")}
          </button>
          <h1 className="font-display text-[36px] font-semibold leading-tight text-ink">{t("events.create.title")}</h1>
          <p className="text-[15px] text-ink-secondary mt-1">{t("events.create.description")}</p>
        </motion.div>

        <div className="h-px bg-border" />

        <form onSubmit={handleSubmit} className="py-10 space-y-8">
          <div>
            <label htmlFor="name" className="block text-[13px] font-medium text-ink-muted mb-2">{t("events.create.nameLabel")}</label>
            <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} placeholder={t("events.create.namePlaceholder")}
              className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron" />
          </div>

          <div>
            <label htmlFor="description" className="block text-[13px] font-medium text-ink-muted mb-2">{t("events.create.descriptionLabel")}</label>
            <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} placeholder={t("events.create.descriptionPlaceholder")}
              className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron resize-none" />
          </div>

          <div>
            <label htmlFor="date" className="block text-[13px] font-medium text-ink-muted mb-2">{t("events.create.dateLabel")}</label>
            <input type="datetime-local" id="date" name="date" required value={formData.date} onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron" />
          </div>

          <div>
            <label htmlFor="venue" className="block text-[13px] font-medium text-ink-muted mb-2">{t("events.create.venueLabel")}</label>
            <input type="text" id="venue" name="venue" value={formData.venue} onChange={handleChange} placeholder={t("events.create.venuePlaceholder")}
              className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron" />
          </div>

          {error && (
            <div className="p-4 border border-ruby/30 bg-ruby/5 text-sm text-ruby">{error}</div>
          )}

          <div className="p-4 border border-saffron/30 bg-saffron/5">
            <p className="text-sm text-ink-secondary">
              <strong>{t("events.create.note")}</strong> {t("events.create.noteDescription")}
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1">{t("common.cancel")}</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t("events.create.creating") : t("events.create.createEvent")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
