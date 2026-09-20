"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Users, Plus, ArrowRight, Check } from "lucide-react";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";
import { useToast } from "@repo/ui/toast";

import { useUser } from "../../lib/UserContext";
import { useLocale } from "../../lib/LocaleContext";
import { apiPost } from "../../lib/api";
import { API_BASE } from "../../lib/config";

/**
 * Performs  families page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function FamiliesPage() {
    const navigate = useNavigate();
    const { user, loading, refresh } = useUser();
    const { t } = useLocale();
    const { toast } = useToast();
    const [creating, setCreating] = useState(false);
    const [familyName, setFamilyName] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoaderOne />
            </div>
        );
    }

    if (!user) {
        navigate("/signin");
        return null;
    }

    const families = user.families || [];

    const handleCreate = async () => {
        if (!familyName.trim()) return;
        setCreating(true);
        try {
            await apiPost(`${API_BASE}/families`, { name: familyName.trim() });
            toast("Family created", { variant: "success" });
            setFamilyName("");
            setShowCreate(false);
            refresh();
        } catch {
            toast("Failed to create family", { variant: "error" });
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="mb-14"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-ink font-display text-display leading-tight font-semibold">
                                {t("nav.families")}
                            </h1>
                            <p className="text-ink-secondary mt-1 text-body-lg">
                                Manage your family connections
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowCreate(!showCreate)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Create family
                        </Button>
                    </div>
                </motion.div>

                <div className="bg-border h-px" />

                {/* Create Family Form */}
                {showCreate && (
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-10"
                    >
                        <h2 className="text-ink mb-2 text-heading-sm font-semibold">
                            Create a new family
                        </h2>
                        <p className="text-ink-muted mb-6 text-sm">
                            You will become the family head and can manage
                            members.
                        </p>
                        <div className="flex max-w-md items-end gap-3">
                            <div className="flex-1">
                                <label className="text-ink-muted mb-2 block text-caption font-semibold tracking-wider uppercase">
                                    Family name
                                </label>
                                <Input
                                    value={familyName}
                                    onChange={(e) =>
                                        setFamilyName(e.target.value)
                                    }
                                    placeholder="e.g. Sharma Family"
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleCreate()
                                    }
                                />
                            </div>
                            <Button
                                onClick={handleCreate}
                                disabled={creating || !familyName.trim()}
                                size="sm"
                            >
                                {creating ? "Creating..." : "Create"}
                            </Button>
                        </div>
                        <div className="bg-border-subtle mt-10 h-px" />
                    </motion.section>
                )}

                {/* Existing Families */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.05 }}
                    className="py-10"
                >
                    <h2 className="text-ink mb-2 text-heading-sm font-semibold">
                        Your families
                    </h2>
                    <p className="text-ink-muted mb-8 text-sm">
                        Families you belong to
                    </p>

                    {families.length > 0 ? (
                        <div className="space-y-4">
                            {families.map((fm) => (
                                <div
                                    key={fm.id}
                                    className="flex items-center justify-between py-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-soft flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                                            <Users className="text-emerald h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-ink text-sm font-medium">
                                                {fm.family.name}
                                            </p>
                                            <p className="text-ink-secondary text-xs">
                                                {fm.role.replace(/_/g, " ")} ·{" "}
                                                {fm.family.uniqueId}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate("/family")}
                                        className="text-ink-muted hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
                                    >
                                        View
                                        <ArrowRight className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-ink-secondary mb-1 text-sm">
                                You don&apos;t belong to any families yet.
                            </p>
                            <p className="text-ink-muted text-sm">
                                Create a family to get started, or ask a family
                                head to add you.
                            </p>
                        </div>
                    )}
                </motion.section>

                <div className="bg-border h-px" />

                {/* Join Family Info */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
                    className="py-10"
                >
                    <h2 className="text-ink mb-2 text-heading-sm font-semibold">
                        Join an existing family
                    </h2>
                    <p className="text-ink-muted mb-4 text-sm">
                        To join a family, ask the family head to add you by your
                        email address. They can do this from the family
                        management page.
                    </p>
                    <div className="text-ink-muted flex items-center gap-2 text-sm">
                        <Check className="text-emerald h-4 w-4" />
                        Family heads can add members directly
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
