"use client";

import { useState, useId } from "react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { useToast } from "@repo/ui/toast";

import { API_BASE } from "../../../lib/config";
import { useLocale } from "../../../lib/LocaleContext";

/**
 * Performs  member signup page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function MemberSignupPage() {
    const { toast } = useToast();
    const { t } = useLocale();
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
                toast(data.message || t("signup.fm.signupFailed"), { variant: "error" });
            }
        } catch {
            toast(t("signup.fm.somethingWentWrong"), { variant: "error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">
                <Card className="p-8">
                    {submitted ? (
                        <SuccessState />
                    ) : (
                        <>
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-display font-bold text-ink tracking-tight">
                                    {t("signup.fm.heading")}
                                </h1>
                                <p className="text-sm text-ink-secondary mt-2">
                                    {t("signup.fm.subtitle")}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <LabeledInput
                                    label={t("signup.fm.fullNameLabel")}
                                    placeholder={t("signup.fm.fullNamePlaceholder")}
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />

                                <LabeledInput
                                    label={t("signup.fm.emailLabel")}
                                    type="email"
                                    placeholder={t("signup.fm.emailPlaceholder")}
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />

                                <LabeledInput
                                    label={t("signup.fm.passwordLabel")}
                                    type="password"
                                    placeholder={t("signup.fm.passwordPlaceholder")}
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                />

                                <LabeledInput
                                    label={t("signup.fm.familyIdLabel")}
                                    placeholder={t("signup.fm.familyIdPlaceholder")}
                                    value={form.familyId}
                                    onChange={(e) =>
                                        setForm({ ...form, familyId: e.target.value })
                                    }
                                />

                                <LabeledInput
                                    label={t("signup.fm.relationLabel")}
                                    placeholder={t("signup.fm.relationPlaceholder")}
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
                                    {loading ? t("signup.fm.submittingRequest") : t("signup.fm.requestToJoin")}
                                </Button>
                            </form>

                            <p className="text-xs text-ink-muted text-center mt-6">
                                {t("signup.fm.alreadyApproved")}{" "}
                                <a href="/signin" className="text-saffron hover:text-ink font-medium transition-colors">
                                    {t("signup.fm.signIn")}
                                </a>
                            </p>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

/**
 * @param {{ label: string; } & React.InputHTMLAttributes<HTMLInputElement>} {
 *     label,
 *     ...props
 * } - Description of {
 *     label,
 *     ...props
 * }
 */
function LabeledInput({
    label,
    ...props
}: {
    label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    const fieldId = useId();
    return (
        <div>
            <label htmlFor={fieldId} className="block text-xs font-medium text-ink-secondary mb-1">{label}</label>
            <Input
                id={fieldId}
                {...props}
                required={props.required !== false}
            />
        </div>
    );
}

/**
 * Performs  success state operation.
 * @returns {React.JSX.Element} Description of return value
 */
function SuccessState() {
    const { t } = useLocale();
    return (
        <div className="py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald/10 flex items-center justify-center mb-4">
                <span className="text-emerald text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-ink">{t("signup.fm.requestSentHeading")}</h2>
            <p className="text-sm text-ink-secondary mt-2">
                {t("signup.fm.requestSentDescription")}
                <br />
                {t("signup.fm.requestSentSubtext")}
            </p>
        </div>
    );
}
