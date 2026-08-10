"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@repo/ui/toast";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

import { apiPost } from "../../lib/api";
import { API_BASE } from "../../lib/config";

const roles = [
  { label: "Family Head", value: "familyhead" },
  { label: "Family Member", value: "member" },
  { label: "Gotra Head", value: "gotrahead" },
  { label: "Community Head", value: "communityhead" },
  { label: "Community Subhead", value: "communitysubhead" },
];

/**
 * Performs  signin page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SigninPage() {
  const router = useRouter();
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
        router.push("/me");
      } else {
        const msg =
          (data && (data.message || data.error)) ||
          "Sign in unsuccessful. Check your credentials and role.";
        setAuthError(msg);
        toast(msg, { variant: "error" });
      }
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        "Network error: " + (err instanceof Error ? err.message : String(err));
      setAuthError(msg);
      toast(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DreamySunsetBackground className="flex items-center justify-center min-h-screen px-4 py-12">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-8 border border-jewel-400/20 shadow-jewel">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-jewel-gold to-jewel-500 text-jewel-deep text-2xl font-bold shadow-lg shadow-jewel-gold/25 mb-4"
            >
              M
            </motion.div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-jewel-900 to-jewel-700 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-jewel-600">
              Sign in to manage your community
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-jewel-700 mb-3">
                Select Your Role
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`
                      relative px-3 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-all duration-300
                      ${
                        role === r.value
                          ? "bg-gradient-to-r from-jewel-gold to-jewel-500 text-jewel-deep border-transparent shadow-lg shadow-jewel-gold/25"
                          : "bg-jewel-50 text-jewel-700 border-jewel-400/30 hover:bg-jewel-100 hover:border-jewel-gold/40"
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
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-jewel-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-jewel-400/30 bg-jewel-50/50 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-jewel-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jewel-400" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-jewel-400/30 bg-jewel-50/50 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {authError ? (
              <div className="rounded-lg border border-jewel-ruby/20 bg-jewel-ruby/5 px-4 py-3 text-sm text-jewel-ruby">
                {authError}
              </div>
            ) : null}

            <Button type="submit" disabled={loading || !email || !password} className="w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-jewel-400/20">
            <p className="text-center text-sm text-jewel-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-jewel-gold hover:text-jewel-500 font-medium transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-jewel-400">
              Forgot your password? Contact the admin or the person who created your account.
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-jewel-500">
            🔒 Secure authentication powered by Modheshwari
          </p>
        </motion.div>
      </motion.main>
    </DreamySunsetBackground>
  );
}
