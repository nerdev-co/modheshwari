"use client";

import { useNavigate } from "react-router-dom";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

import { useLocale } from "../../lib/LocaleContext";

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <DreamySunsetBackground className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-display font-bold text-jewel-900 mb-4">{t("notFound.title")}</h1>
        <p className="text-lg text-jewel-600 mb-8">
          {t("notFound.description")}
        </p>
        <Button onClick={() => navigate("/")}>
          {t("notFound.goHome")}
        </Button>
      </div>
    </DreamySunsetBackground>
  );
}
