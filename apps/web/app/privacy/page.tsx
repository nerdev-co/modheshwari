"use client";

import { useLocale } from "../../lib/LocaleContext";

/**
 * Performs  privacy operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function Privacy() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-ink mb-4">
            {t("privacy.title")}
          </h1>
          <p className="text-saffron font-medium">
            {t("privacy.lastUpdated")}
          </p>
        </div>

        <div className="bg-surface border p-8 border-border mb-8">
          <p className="text-ink-secondary text-lg leading-relaxed">
            {t("privacy.intro")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface border p-6 border-border">
            <h2 className="text-xl font-display font-bold text-ink mb-3">{t("privacy.securityTips")}</h2>
            <ul className="space-y-2 text-ink-secondary">
              <li>{t("privacy.useStrongPasswords")}</li>
              <li>{t("privacy.neverSharePassword")}</li>
              <li>{t("privacy.changePasswordRegularly")}</li>
              <li>{t("privacy.logOutAfterSession")}</li>
            </ul>
          </div>

          <div className="bg-surface border p-6 border-border">
            <h2 className="text-xl font-display font-bold text-ink mb-3">{t("privacy.beforeRequests")}</h2>
            <ul className="space-y-2 text-ink-secondary">
              <li>{t("privacy.discussWithFamily")}</li>
              <li>{t("privacy.speakWithPeers")}</li>
              <li>{t("privacy.considerCommunityImpact")}</li>
              <li>{t("privacy.reviewGuidelines")}</li>
            </ul>
          </div>
        </div>

        <div className="bg-saffron/10 p-8 border border-saffron/30">
          <div className="flex items-start gap-4">
            <div>
              <h3 className="text-xl font-display font-bold text-ink mb-2">{t("privacy.important")}</h3>
              <p className="text-ink-secondary">
                {t("privacy.importantMessage")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-ink-muted text-sm">
            {t("privacy.contactText")}
          </p>
        </div>
      </div>
    </div>
  );
}
