"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { useToast } from "@repo/ui/toast";

import { API_BASE } from "../../../lib/config";

/**
 * Performs  member signup page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function MemberSignupPage() {
    const { toast } = useToast();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        familyId: "",
        relationWithFamilyHead: "",
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(
                `${API_BASE}/signup/member`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                },
            );

            const data = await res.json();

            if (data.status === "success") {
                setSubmitted(true);
            } else {
                toast(data.message || "Signup failed", { variant: "error" });
            }
        } catch {
            toast("Something went wrong", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <DreamySunsetBackground className="flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">
                <div className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 rounded-2xl p-8 shadow-jewel">
                    {submitted ? (
                        <SuccessState />
                    ) : (
                        <>
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-jewel-900 to-jewel-700 bg-clip-text text-transparent tracking-tight">
                                    Join a Family
                                </h1>
                                <p className="text-sm text-jewel-600 mt-2">
                                    Your request will be sent to the family head for approval
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Input
                                    label="Full Name"
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />

                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />

                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                />

                                <Input
                                    label="Family ID"
                                    placeholder="Provided by family head"
                                    value={form.familyId}
                                    onChange={(e) =>
                                        setForm({ ...form, familyId: e.target.value })
                                    }
                                />

                                <Input
                                    label="Relation (optional)"
                                    placeholder="Son, Daughter, Relative…"
                                    value={form.relationWithFamilyHead}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            relationWithFamilyHead: e.target.value,
                                        })
                                    }
                                />

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-4"
                                >
                                    {loading ? "Submitting Request…" : "Request to Join"}
                                </Button>
                            </form>

                            <p className="text-xs text-jewel-500 text-center mt-6">
                                Already approved?{" "}
                                <a href="/signin" className="text-jewel-gold hover:text-jewel-500 font-medium transition-colors">
                                    Sign in
                                </a>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </DreamySunsetBackground>
    );
}

/**
 * Performs  input operation.
 * @param {{ label: string; } & React.InputHTMLAttributes<HTMLInputElement>} {
 *     label,
 *     ...props
 * } - Description of {
 *     label,
 *     ...props
 * }
 * @returns {React.JSX.Element} Description of return value
 */
function Input({
    label,
    ...props
}: {
    label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <label className="block text-xs font-medium text-jewel-700 mb-1">{label}</label>
            <input
                {...props}
                required={props.required !== false}
                className="w-full px-4 py-3 rounded-lg border border-jewel-400/30 bg-jewel-50/50 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
            />
        </div>
    );
}

/**
 * Performs  success state operation.
 * @returns {React.JSX.Element} Description of return value
 */
function SuccessState() {
    return (
        <div className="py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-jewel-emerald/10 flex items-center justify-center mb-4">
                <span className="text-jewel-emerald text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-jewel-900">Request Sent</h2>
            <p className="text-sm text-jewel-600 mt-2">
                The family head will review your request.
                <br />
                You&apos;ll be able to sign in once approved.
            </p>
        </div>
    );
}
