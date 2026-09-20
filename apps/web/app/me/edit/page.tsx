"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LoaderFour } from "@repo/ui/loading";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import apiFetch from "../../../lib/api";
import { API_BASE } from "../../../lib/config";
import { useUser } from "../../../lib/UserContext";
import { useLocale } from "../../../lib/LocaleContext";

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

      if (data?.status === "success") {
        toast(t("edit.updateSuccess"), { variant: "success" });
        const updated = data.data;
        if (updated) updateProfile(updated);
        navigate("/me");
      } else {
        const msg = data?.message || t("edit.updateFailed");
        toast(msg, { variant: "error" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("edit.updateError");
      toast(msg, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderFour text={t("edit.loadingProfile")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[640px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION_PAGE_ENTER}
          className="mb-14"
        >
          <h1 className="font-display text-display font-semibold leading-tight text-ink">
            {t("edit.title")}
          </h1>
        </motion.div>

        <div className="h-px bg-border" />

        <form onSubmit={handleSubmit} className="py-10 space-y-8">
          <div>
            <label htmlFor="bloodGroup" className="block text-body font-medium text-ink-muted mb-2">
              {t("profile.bloodGroup")}
            </label>
            <input
              type="text"
              id="bloodGroup"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              placeholder={t("edit.bloodGroupPlaceholder")}
              className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron"
            />
          </div>

          <div>
            <label htmlFor="gotra" className="block text-body font-medium text-ink-muted mb-2">
              {t("profile.gotra")}
            </label>
            <input
              type="text"
              id="gotra"
              name="gotra"
              value={formData.gotra}
              onChange={handleChange}
              placeholder={t("edit.gotraPlaceholder")}
              className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron"
            />
          </div>

          <div>
            <label htmlFor="profession" className="block text-body font-medium text-ink-muted mb-2">
              {t("profile.profession")}
            </label>
            <input
              type="text"
              id="profession"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              placeholder={t("edit.professionPlaceholder")}
              className="w-full px-4 py-2.5 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron"
            />
          </div>

          <div className="h-px bg-border" />

          <div className="flex gap-3">
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
    </div>
  );
}
