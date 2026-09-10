"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, FileText, ArrowLeft, Loader } from "lucide-react";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

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
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          {t("events.create.back")}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-jewel-900 tracking-tight">{t("events.create.title")}</h1>
          <p className="text-sm text-jewel-500 mt-1">
            {t("events.create.description")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-jewel-700 mb-2">
              {t("events.create.nameLabel")}
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={t("events.create.namePlaceholder")}
                className="w-full pl-11 pr-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-jewel-700 mb-2">
              {t("events.create.descriptionLabel")}
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder={t("events.create.descriptionPlaceholder")}
              className="w-full px-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-jewel-700 mb-2">
              {t("events.create.dateLabel")}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
              <input
                type="datetime-local"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-jewel-700 mb-2">
              {t("events.create.venueLabel")}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder={t("events.create.venuePlaceholder")}
                className="w-full pl-11 pr-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-jewel-ruby/10 border border-jewel-ruby/30 rounded-xl text-jewel-ruby text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-jewel-gold/10 border border-jewel-gold/30 rounded-xl">
            <p className="text-sm text-jewel-700">
              <strong>{t("events.create.note")}</strong> {t("events.create.noteDescription")}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {t("events.create.creating")}
                </span>
              ) : (
                t("events.create.createEvent")
              )}
            </Button>
          </div>
        </form>
      </div>
    </DreamySunsetBackground>
  );
}
