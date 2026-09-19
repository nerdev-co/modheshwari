"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@repo/ui/toast";
import { Button } from "@repo/ui/button";
import { MOTION_ENTER } from "@repo/ui/motion";
import { Input } from "@repo/ui/input";

import { apiPost } from "../../lib/api";
import { API_BASE } from "../../lib/config";
import { useLocale } from "../../lib/LocaleContext";

const roles = [
  { label: "signin.familyHead", value: "familyhead" },
  { label: "signin.familyMember", value: "member" },
  { label: "signin.gotraHead", value: "gotrahead" },
  { label: "signin.communityHead", value: "communityhead" },
  { label: "signin.communitySubhead", value: "communitysubhead" },
];

/**
 * Performs  signin page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SigninPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("familyhead");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const resp = await apiPost(
        `${API_BASE}/login/${role}`,
        { email, password },
        { throwOnError: false },
      );

      const data = resp && (resp.ok === false ? resp.data : resp);

      const token = data?.data?.token || data?.token;
      if (token) {
        localStorage.setItem("token", token);
        try {
          window.dispatchEvent(new Event("authChanged"));
        } catch {
          // ignore dispatch errors
        }
        navigate("/me");
      } else {
        const msg =
          (data && (data.message || data.error)) ||
          t("signin.authFailed");
        setAuthError(msg);
        toast(msg, { variant: "error" });
      }
    } catch (err) {
        const msg =
          t("signin.networkError") + ": " + (err instanceof Error ? err.message : String(err));
      setAuthError(msg);
      toast(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION_ENTER}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-surface p-8 border border-border">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...MOTION_ENTER, delay: 0.1 }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-saffron text-white text-2xl font-bold mb-4"
            >
              M
            </motion.div>
            <h1 className="text-3xl font-display font-bold text-ink mb-2">
              {t("signin.title")}
            </h1>
            <p className="text-sm text-ink-secondary">
              {t("signin.subtitle")}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <fieldset>
              <legend className="block text-xs font-medium text-ink-secondary mb-3">
                {t("signin.selectRole")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`
                      relative px-3 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-all duration-300
                      ${
                        role === r.value
                          ? "bg-saffron text-white border-transparent"
                          : "bg-surface-muted text-ink border-border hover:bg-saffron-muted hover:border-saffron/40"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                      className="hidden"
                    />
                    {r.label && t(r.label)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="signin-email" className="block text-xs font-medium text-ink-secondary mb-2">
                {t("signin.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
                <Input
                  id="signin-email"
                  className="pl-11 pr-4 py-3 rounded-lg"
                  placeholder={t("signin.emailPlaceholder")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="signin-password" className="block text-xs font-medium text-ink-secondary mb-2">
                {t("signin.passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
                <Input
                  id="signin-password"
                  className="pl-11 pr-4 py-3 rounded-lg"
                  placeholder={t("signin.passwordPlaceholder")}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {authError ? (
              <div className="rounded-lg border border-ruby/20 bg-ruby/5 px-4 py-3 text-sm text-ruby">
                {authError}
              </div>
            ) : null}

            <Button type="submit" disabled={loading || !email || !password} className="w-full">
                  {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("signin.signingIn")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t("signin.signIn")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-ink-secondary">
              {t("signin.noAccount")}{" "}
              <Link
                to="/signup"
                className="text-saffron hover:text-ink font-medium transition-colors"
              >
                {t("signin.signUp")}
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-ink-muted">
              {t("signin.forgotPassword")}
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_ENTER, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-ink-muted">
            🔒 {t("signin.secureSignin")}
          </p>
        </motion.div>
      </motion.main>
    </div>
  );
}
