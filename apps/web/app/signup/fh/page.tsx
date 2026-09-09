"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Users,
  Loader2,
  ArrowRight,
  Shield,
} from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

import { API_BASE } from "../../../lib/config";
import { useLocale } from "../../../lib/LocaleContext";

/**
 * Performs  signup page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLocale();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    familyName: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/signup/familyhead`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();

      if (data.status === "success") {
        toast(t("signup.fh.signupSuccess"), { variant: "success" });
        navigate("/me");
      } else {
        toast(data.message || t("signup.fh.signupFailed"), { variant: "error" });
      }
    } catch {
      toast(t("signup.fh.signupError"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  const isFormValid =
    form.name && form.email && form.password && form.familyName;

  return (
    <DreamySunsetBackground className="flex items-center justify-center px-4 relative overflow-hidden">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-8 border border-jewel-400/20 shadow-jewel">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-jewel-gold to-jewel-500 text-jewel-deep text-lg font-bold shadow-lg shadow-jewel-gold/25 mb-4"
            >
              <Users className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-jewel-900 to-jewel-700 bg-clip-text text-transparent mb-2">
              {t("signup.fh.heading")}
            </h1>
            <p className="text-sm text-jewel-600">
              {t("signup.fh.subtitle")}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-jewel-700 mb-2">
                {t("signup.fh.fullNameLabel")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-jewel-400/30 bg-jewel-50/50 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
                  placeholder={t("signup.fh.fullNamePlaceholder")}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-jewel-700 mb-2">
                {t("signup.fh.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-jewel-400/30 bg-jewel-50/50 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
                  placeholder={t("signup.fh.emailPlaceholder")}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-jewel-700 mb-2">
                {t("signup.fh.passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-jewel-400/30 bg-jewel-50/50 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
                  placeholder={t("signup.fh.passwordPlaceholder")}
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-jewel-700 mb-2">
                {t("signup.fh.familyNameLabel")}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-jewel-400/30 bg-jewel-50/50 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
                  placeholder={t("signup.fh.familyNamePlaceholder")}
                  type="text"
                  value={form.familyName}
                  onChange={(e) =>
                    setForm({ ...form, familyName: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isFormValid) {
                      void handleSubmit();
                    }
                  }}
                  required
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("signup.fh.creatingAccount")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t("signup.fh.createFamilyAccount")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-jewel-400/20">
            <p className="text-center text-sm text-jewel-600">
              {t("signup.fh.alreadyHaveAccount")}{" "}
              <a
                href="/signin"
                className="text-jewel-gold hover:text-jewel-500 font-medium transition-colors"
              >
                {t("signup.fh.signIn")}
              </a>
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 bg-jewel-50/60 backdrop-blur-xl rounded-xl p-4 border border-jewel-400/20"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-jewel-gold flex-shrink-0 mt-0.5" />
            <p className="text-xs text-jewel-600 leading-relaxed">
              {t("signup.fh.description")}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 space-y-2"
        >
          {[
            t("signup.fh.feature1"),
            t("signup.fh.feature2"),
            t("signup.fh.feature3"),
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-jewel-500"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-jewel-gold/50" />
              <span>{feature}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-jewel-500">
            {t("signup.fh.secureSignup")}
          </p>
        </motion.div>
      </motion.main>
    </DreamySunsetBackground>
  );
}
