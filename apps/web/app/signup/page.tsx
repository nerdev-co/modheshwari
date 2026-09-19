"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Users } from "lucide-react";
import { Card } from "@repo/ui/card";
import { MOTION_ENTER } from "@repo/ui/motion";

import { useLocale } from "../../lib/LocaleContext";

/**
 * Performs  signup landing page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SignupLandingPage() {
  const { t } = useLocale();
  const signupOptions = [
    {
      href: "/signup/fh",
      title: t("signup.landing.familyHead"),
      description: t("signup.landing.familyHeadDesc"),
    },
    {
      href: "/signup/fm",
      title: t("signup.landing.familyMember"),
      description: t("signup.landing.familyMemberDesc"),
    },
  ];
  return (
    <div className="flex items-center justify-center px-4 py-12 min-h-screen">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION_ENTER}
        className="w-full max-w-3xl relative z-10"
      >
        <Card className="p-8 sm:p-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-saffron to-ink-muted text-ink text-2xl font-bold shadow-lg mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink mb-3">
              {t("signup.landing.title")}
            </h1>
            <p className="text-sm sm:text-base text-ink-secondary">
              {t("signup.landing.subtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {signupOptions.map((option) => (
              <Link
                key={option.href}
                to={option.href}
                className="group border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-saffron hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-saffron/10 px-3 py-1 text-xs font-semibold text-saffron">
                      <Shield className="h-3.5 w-3.5" />
                       {t("signup.landing.signup")}
                    </div>
                    <h2 className="mt-4 text-2xl font-display font-bold text-ink">
                      {option.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                      {option.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 text-saffron transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-ink-muted">
            {t("signup.landing.alreadyApproved")}{" "}
            <Link to="/signin" className="font-medium text-saffron hover:text-ink">{t("signup.landing.signIn")}</Link>
          </div>
        </Card>
      </motion.main>
    </div>
  );
}
