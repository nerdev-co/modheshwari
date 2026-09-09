"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderFour } from "@repo/ui/loading";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

import apiFetch from "../../../lib/api";
import { API_BASE } from "../../../lib/config";
import { useUser } from "../../../lib/UserContext";
import { useLocale } from "../../../lib/LocaleContext";

/**
 * Performs  edit profile page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function EditProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, updateProfile } = useUser();
  const { t } = useLocale();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => ({
    bloodGroup: "",
    gotra: "",
    profession: "",
  }));

  // Initialize form from context when user loads
  const [initialized, setInitialized] = useState(false);
  if (user && !initialized) {
    setFormData({
      bloodGroup: user.profile?.bloodGroup || "",
      gotra: user.profile?.gotra || "",
      profession: user.profile?.profession || "",
    });
    setInitialized(true);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast(t("edit.signinRequired"), { variant: "warning" });
      navigate("/signin");
      return;
    }

    if (!formData.bloodGroup && !formData.gotra && !formData.profession) {
      toast(t("edit.fillAtLeastOne"), { variant: "warning" });
      return;
    }

    setSaving(true);

    try {
      const data = await apiFetch(`${API_BASE}/me`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (data.status === "success") {
        toast(t("edit.updateSuccess"), { variant: "success" });
        const updated = data.data;
        if (updated) updateProfile(updated);
        navigate("/me");
      } else {
        toast(data.message || t("edit.updateFailed"), { variant: "error" });
      }
    } catch {
      toast(t("edit.updateError"), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DreamySunsetBackground className="flex items-center justify-center min-h-screen">
        <LoaderFour text={t("edit.loadingProfile")} />
      </DreamySunsetBackground>
    );
  }

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-8"
        >
          <h1 className="text-2xl font-display font-bold text-jewel-900 mb-6">
            {t("edit.title")}
          </h1>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="bloodGroup" className="block text-sm font-medium text-jewel-700">
                {t("profile.bloodGroup")}
              </label>
              <input
                type="text"
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                placeholder={t("edit.bloodGroupPlaceholder")}
                className="mt-1 block w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="gotra" className="block text-sm font-medium text-jewel-700">
                {t("profile.gotra")}
              </label>
              <input
                type="text"
                id="gotra"
                name="gotra"
                value={formData.gotra}
                onChange={handleChange}
                placeholder={t("edit.gotraPlaceholder")}
                className="mt-1 block w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-jewel-700">
                {t("profile.profession")}
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                placeholder={t("edit.professionPlaceholder")}
                className="mt-1 block w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? t("edit.saving") : t("edit.saveChanges")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </DreamySunsetBackground>
  );
}
