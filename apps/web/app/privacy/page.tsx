"use client";

import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { useLocale } from "../../lib/LocaleContext";

export default function Privacy() {
  const { t } = useLocale();

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-jewel-900 mb-4">
            {t("privacy.title")}
          </h1>
          <p className="text-jewel-gold font-medium">
            {t("privacy.lastUpdated")}
          </p>
        </div>

        <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-8 border border-jewel-400/20 shadow-jewel mb-8">
          <p className="text-jewel-700 text-lg leading-relaxed">
            {t("privacy.intro")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-6 border border-jewel-400/20 shadow-jewel">
            <h2 className="text-xl font-display font-bold text-jewel-900 mb-3">{t("privacy.securityTips")}</h2>
            <ul className="space-y-2 text-jewel-700">
              <li>{t("privacy.useStrongPasswords")}</li>
              <li>{t("privacy.neverSharePassword")}</li>
              <li>{t("privacy.changePasswordRegularly")}</li>
              <li>{t("privacy.logOutAfterSession")}</li>
            </ul>
          </div>

          <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-6 border border-jewel-400/20 shadow-jewel">
            <h2 className="text-xl font-display font-bold text-jewel-900 mb-3">{t("privacy.beforeRequests")}</h2>
            <ul className="space-y-2 text-jewel-700">
              <li>{t("privacy.discussWithFamily")}</li>
              <li>{t("privacy.speakWithPeers")}</li>
              <li>{t("privacy.considerCommunityImpact")}</li>
              <li>{t("privacy.reviewGuidelines")}</li>
            </ul>
          </div>
        </div>

        <div className="bg-jewel-gold/10 rounded-2xl p-8 border-2 border-jewel-gold/30">
          <div className="flex items-start gap-4">
            <div>
              <h3 className="text-xl font-display font-bold text-jewel-900 mb-2">{t("privacy.important")}</h3>
              <p className="text-jewel-700">
                {t("privacy.importantMessage")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-jewel-400/20 text-center">
          <p className="text-jewel-500 text-sm">
            {t("privacy.contactText")}
          </p>
        </div>
      </div>
    </DreamySunsetBackground>
  );
}
