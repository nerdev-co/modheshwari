"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { LoadingState } from "@repo/ui/loadingState";

import FamilyTreeView from "../FamilyTreeView";
import { useUser } from "../../../lib/UserContext";
import { useLocale } from "../../../lib/LocaleContext";

export default function FamilyTreePage() {
  const { user, loading } = useUser();
  const { t } = useLocale();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/signin");
  }, [user, loading, navigate]);

  if (loading) return (
    <DreamySunsetBackground className="px-6 py-10 flex items-center justify-center">
      <LoadingState message={t("common.loading")} />
    </DreamySunsetBackground>
  );
  if (!user) return null;

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-display font-bold text-jewel-900">{t("family.tree.title")}</h1>
          <p className="text-jewel-500">
            {t("family.tree.description")}
          </p>
        </div>
        <FamilyTreeView />
      </div>
    </DreamySunsetBackground>
  );
}
