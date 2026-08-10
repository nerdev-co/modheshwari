"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, FileText, ArrowLeft, Loader } from "lucide-react";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

import apiFetch from "../../../lib/api";

/**
 * Performs  create event page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function CreateEventPage() {
  const router = useRouter();
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
      router.push("/events");
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
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-jewel-900 tracking-tight">Create Event</h1>
          <p className="text-sm text-jewel-500 mt-1">
            Create a new community event. It will require admin approval before
            being published.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-jewel-700 mb-2">
              Event Name *
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
                placeholder="Annual Community Gathering"
                className="w-full pl-11 pr-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-jewel-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about your event..."
              className="w-full px-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-jewel-700 mb-2">
              Date & Time *
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
                className="w-full pl-11 pr-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-jewel-700 mb-2">
              Venue
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="Community Hall, Main Street"
                className="w-full pl-11 pr-4 py-3 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
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
              <strong>Note:</strong> Your event will be sent for approval to
              community admins. You&apos;ll be notified once it&apos;s reviewed.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DreamySunsetBackground>
  );
}
