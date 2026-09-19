"use client";

import { useNavigate } from "react-router-dom";
import { Button } from "@repo/ui/button";

import { useLocale } from "../../lib/LocaleContext";

/**
 * Performs  not found operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-display font-bold text-ink mb-4">{t("notFound.title")}</h1>
        <p className="text-lg text-ink-secondary mb-8">
          {t("notFound.description")}
        </p>
        <Button onClick={() => navigate("/")}>
          {t("notFound.goHome")}
        </Button>
      </div>
    </div>
  );
}
