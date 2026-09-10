"use client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/button";
import {
  Users,
  Shield,
  FileText,
  Heart,
  Bell,
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { MOTION_ENTER } from "@repo/ui/motion";

import { useLocale } from "../lib/LocaleContext";

export default function Home() {
  const navigate = useNavigate();
  const { t, locale } = useLocale();

  const features = [
    {
      icon: Users,
      titleKey: "landing.feature1Title",
      descKey: "landing.feature1Desc",
      color: "bg-accent-muted text-accent",
    },
    {
      icon: Shield,
      titleKey: "landing.feature2Title",
      descKey: "landing.feature2Desc",
      color: "bg-jewel-emerald/10 text-jewel-emerald",
    },
    {
      icon: Heart,
      titleKey: "landing.feature3Title",
      descKey: "landing.feature3Desc",
      color: "bg-jewel-ruby/10 text-jewel-ruby",
    },
    {
      icon: Calendar,
      titleKey: "landing.feature4Title",
      descKey: "landing.feature4Desc",
      color: "bg-jewel-saffron/10 text-jewel-saffron",
    },
    {
      icon: Bell,
      titleKey: "landing.feature5Title",
      descKey: "landing.feature5Desc",
      color: "bg-jewel-100 text-jewel-600",
    },
    {
      icon: FileText,
      titleKey: "landing.feature6Title",
      descKey: "landing.feature6Desc",
      color: "bg-accent-muted text-accent",
    },
  ];

  const stats = [
    { value: "500+", labelKey: "landing.families" },
    { value: "2,000+", labelKey: "landing.members" },
    { value: "50+", labelKey: "landing.gotras" },
  ];

  return (
    <div className="relative min-h-screen">
      <main className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION_ENTER}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-muted border border-accent/20 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs text-accent font-medium">
            {t("landing.badge")}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_ENTER, delay: 0.05 }}
          className="text-4xl sm:text-6xl font-display font-bold tracking-tight text-center max-w-3xl text-text-primary"
        >
          {t("landing.title")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_ENTER, delay: 0.1 }}
          className="mt-5 max-w-xl text-base sm:text-lg text-text-secondary text-center leading-relaxed"
        >
          {t("landing.description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_ENTER, delay: 0.15 }}
          className="mt-8 flex flex-col sm:flex-row gap-3"
        >
          <Button onClick={() => navigate("/signin")}>
            {t("landing.getStarted")}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {t("landing.seeFeatures")}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_ENTER, delay: 0.2 }}
          className="mt-16 grid grid-cols-3 gap-8 sm:gap-16"
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-text-primary">
                {stat.value}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-text-muted">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </motion.div>

        <section id="features" className="mt-24 w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={MOTION_ENTER}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-text-primary mb-3">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-text-secondary text-sm sm:text-base">
              {t("landing.featuresDescription")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ ...MOTION_ENTER, delay: idx * 0.05 }}
              >
                <div className="card-elevated h-full group hover:shadow-medium transition-shadow duration-fast">
                  <div className={`inline-flex p-2.5 rounded-xl ${feature.color} mb-3`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-24 w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={MOTION_ENTER}
            className="card-elevated p-8 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-accent-muted mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-3">
              {t("landing.ctaTitle")}
            </h2>
            <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
              {t("landing.ctaDescription")}
            </p>
            <Button onClick={() => navigate("/signin")}>
              {t("landing.ctaButton")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </section>

        <footer className="mt-20 text-center text-text-muted text-xs pb-8">
          <p>{t("landing.footer")}</p>
        </footer>
      </main>
    </div>
  );
}
