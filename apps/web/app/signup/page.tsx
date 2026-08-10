"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Users } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";

const signupOptions = [
  {
    href: "/signup/fh",
    title: "Family Head",
    description: "Create a new family account and become the primary manager.",
  },
  {
    href: "/signup/fm",
    title: "Family Member",
    description: "Request to join an existing family with approval.",
  },
];

/**
 * Performs  signup landing page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SignupLandingPage() {
  return (
    <DreamySunsetBackground className="flex items-center justify-center px-4 py-12 min-h-screen">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-3xl relative z-10"
      >
        <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-jewel-400/20 shadow-jewel">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-jewel-gold to-jewel-500 text-jewel-deep text-2xl font-bold shadow-lg shadow-jewel-gold/25 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-jewel-900 to-jewel-700 bg-clip-text text-transparent mb-3">
              Choose your signup path
            </h1>
            <p className="text-sm sm:text-base text-jewel-600">
              The app has two signup flows. Pick the one that matches your role.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {signupOptions.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="group rounded-2xl border border-jewel-400/20 bg-jewel-50/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-jewel-gold/40 hover:shadow-lg hover:shadow-jewel-gold/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-jewel-gold/10 px-3 py-1 text-xs font-semibold text-jewel-gold">
                      <Shield className="h-3.5 w-3.5" />
                      Signup
                    </div>
                    <h2 className="mt-4 text-2xl font-display font-bold text-jewel-900">
                      {option.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-jewel-600">
                      {option.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 text-jewel-gold transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-jewel-500">
            Already approved? <Link href="/signin" className="font-medium text-jewel-gold hover:text-jewel-500">Sign in</Link>
          </div>
        </div>
      </motion.main>
    </DreamySunsetBackground>
  );
}