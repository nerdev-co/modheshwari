"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Bug, HelpCircle, Lightbulb, MessageSquare, Send } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { useLocale } from "../../lib/LocaleContext";

type ContactType = "question" | "bug" | "feature" | "feedback";

interface ContactFormState {
    name: string;
    email: string;
    subject: string;
    message: string;
    type: ContactType;
}

const INITIAL_FORM_STATE: ContactFormState = {
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "question",
};

/**
 * Performs contact page operations.
 */
export default function ContactPage() {
    const { t } = useLocale();
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setFormData((p) => ({ ...p, [name]: value }));
        },
        [],
    );

    const isFormValid = useMemo(
        () =>
            !!(
                formData.name &&
                formData.email &&
                formData.subject &&
                formData.message
            ),
        [formData],
    );

    const handleSubmit = async () => {
        if (!isFormValid || isSubmitting) return;
        setIsSubmitting(true);
        await new Promise((r) => setTimeout(r, 1200));
        setSubmitted(true);
        setIsSubmitting(false);
    };

    const contactTypes = [
        { value: "question" as const, label: t("contact.typeQuestion"), icon: HelpCircle },
        { value: "bug" as const, label: t("contact.typeBug"), icon: Bug },
        { value: "feature" as const, label: t("contact.typeFeature"), icon: Lightbulb },
        { value: "feedback" as const, label: t("contact.typeFeedback"), icon: MessageSquare },
    ];

    return (
        <DreamySunsetBackground className="px-6 py-10">
            <section className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14 space-y-4">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-jewel-100/60 border border-jewel-400/20 text-sm text-jewel-600">
                        {t("contact.badge")}
                    </span>
                    <h1 className="text-5xl font-display font-bold tracking-tight bg-gradient-to-r from-jewel-900 to-jewel-700 bg-clip-text text-transparent">
                        {t("contact.heading")}
                    </h1>
                    <p className="text-jewel-600 max-w-xl mx-auto">
                        {t("contact.subtitle")}
                    </p>
                </div>

                {/* Type Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {contactTypes.map((t) => {
                        const Icon = t.icon;
                        const active = formData.type === t.value;
                        return (
                            <Button
                                key={t.value}
                                variant="secondary"
                                onClick={() => setFormData((p) => ({ ...p, type: t.value }))}
                                className={`relative overflow-hidden rounded-2xl p-4 border transition-all
                  ${active
                                        ? "bg-jewel-gold/10 border-jewel-gold/40 text-jewel-900 shadow-jewel"
                                        : "bg-jewel-50/60 border-jewel-400/20 hover:border-jewel-gold/30 text-jewel-600"
                                    }
                `}
                            >
                                <div className="flex flex-col items-center gap-2 relative z-10">
                                    <Icon className="w-6 h-6" />
                                    <span className="text-sm font-semibold">{t.label}</span>
                                </div>
                            </Button>
                        );
                    })}
                </div>

                {/* Form Card */}
                <Card className="p-8 rounded-3xl">
                    {submitted ? (
                        <div className="py-20 text-center">
                            <div className="w-14 h-14 mx-auto rounded-full bg-jewel-emerald/10 flex items-center justify-center">
                                <Send className="w-7 h-7 text-jewel-emerald" />
                            </div>
                            <h2 className="mt-6 text-2xl font-display font-bold text-jewel-900">
                                {t("contact.successHeading")}
                            </h2>
                            <p className="text-jewel-600 mt-2">
                                {t("contact.successDescription")}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    name="name"
                                    aria-label={t("contact.namePlaceholder")}
                                    placeholder={t("contact.namePlaceholder")}
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                                <Input
                                    name="email"
                                    aria-label={t("contact.emailPlaceholder")}
                                    placeholder={t("contact.emailPlaceholder")}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                <Input
                                    name="subject"
                                    aria-label={t("contact.subjectPlaceholder")}
                                    placeholder={t("contact.subjectPlaceholder")}
                                    value={formData.subject}
                                    onChange={handleChange}
                                />
                            </div>

                            <textarea
                                name="message"
                                rows={6}
                                aria-label={t("contact.messagePlaceholder")}
                                placeholder={t("contact.messagePlaceholder")}
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full rounded-xl bg-jewel-50/50 border border-jewel-400/30 px-4 py-3 text-sm text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all resize-none"
                            />

                            <Button
                                onClick={handleSubmit}
                                disabled={!isFormValid || isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? t("contact.sending") : t("contact.sendMessage")}
                            </Button>
                        </div>
                    )}
                </Card>
            </section>
        </DreamySunsetBackground>
    );
}
