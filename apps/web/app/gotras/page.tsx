"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";
import { LoaderOne } from "@repo/ui/loading";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Users, ChevronRight, Crown } from "lucide-react";

import { useLocale } from "../../lib/LocaleContext";
import { useUser } from "../../lib/UserContext";
import { apiFetch } from "../../lib/api";
import { API_BASE } from "../../lib/config";

type Gotra = {
    name: string;
    memberCount: number;
    head: { id: string; name: string } | null;
};

type GotraFamily = {
    id: string;
    name: string;
    uniqueId: string;
    headId: string | null;
    members: Array<{ userId: string; name: string; email: string; role: string }>;
};

export default function GotrasPage() {
    const navigate = useNavigate();
    const { t } = useLocale();
    const { user } = useUser();
    const [gotras, setGotras] = useState<Gotra[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGotra, setSelectedGotra] = useState<string | null>(null);
    const [families, setFamilies] = useState<GotraFamily[]>([]);
    const [loadingFamilies, setLoadingFamilies] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/signin");
            return;
        }
        const fetchGotras = async () => {
            try {
                const res = await apiFetch(`${API_BASE}/gotras`);
                if (res?.data) {
                    setGotras(res.data.gotras);
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchGotras();
    }, [user, navigate]);

    const handleSelectGotra = async (gotraName: string) => {
        if (selectedGotra === gotraName) {
            setSelectedGotra(null);
            setFamilies([]);
            return;
        }
        setSelectedGotra(gotraName);
        setLoadingFamilies(true);
        try {
            const res = await apiFetch(
                `${API_BASE}/gotras/${encodeURIComponent(gotraName)}/families`,
            );
            if (res?.data) {
                setFamilies(res.data.families);
            }
        } catch {
            // silently fail
        } finally {
            setLoadingFamilies(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoaderOne />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="mb-14"
                >
                    <h1 className="font-display text-display font-semibold leading-tight text-ink">
                        {t("nav.gotras")}
                    </h1>
                    <p className="text-body-lg text-ink-secondary mt-1">
                        Community gotras and their families
                    </p>
                </motion.div>

                <div className="h-px bg-border" />

                <div className="py-10">
                    {gotras.length > 0 ? (
                        <div className="space-y-3">
                            {gotras.map((gotra) => (
                                <motion.div
                                    key={gotra.name}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={MOTION_PAGE_ENTER}
                                >
                                    <button
                                        onClick={() => handleSelectGotra(gotra.name)}
                                        className={`w-full text-left p-4 border rounded-xl transition-colors ${
                                            selectedGotra === gotra.name
                                                ? "border-saffron bg-saffron-soft"
                                                : "border-border bg-surface-raised hover:bg-surface-muted"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-soft text-emerald font-display-bold text-heading">
                                                    {gotra.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-body font-semibold text-ink">
                                                        {gotra.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="emerald" size="sm">
                                                            {gotra.memberCount} members
                                                        </Badge>
                                                        {gotra.head && (
                                                            <span className="flex items-center gap-1 text-caption text-ink-muted">
                                                                <Crown className="h-3 w-3" />
                                                                {gotra.head.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight
                                                className={`h-4 w-4 text-ink-muted transition-transform ${
                                                    selectedGotra === gotra.name ? "rotate-90" : ""
                                                }`}
                                            />
                                        </div>
                                    </button>

                                    {/* Families within selected gotra */}
                                    {selectedGotra === gotra.name && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="ml-6 mt-3 space-y-2"
                                        >
                                            {loadingFamilies ? (
                                                <div className="py-4 text-center">
                                                    <LoaderOne />
                                                </div>
                                            ) : families.length > 0 ? (
                                                families.map((family) => (
                                                    <div
                                                        key={family.id}
                                                        className="flex items-center justify-between p-3 border border-border-subtle rounded-lg bg-surface-muted"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-saffron-soft text-saffron text-sm font-semibold">
                                                                <Users className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-ink">
                                                                    {family.name}
                                                                </p>
                                                                <p className="text-caption text-ink-muted">
                                                                    {family.members.length} members · {family.uniqueId}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate("/family")}
                                                        >
                                                            View
                                                        </Button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="py-4 text-center text-sm text-ink-muted">
                                                    No families found in this gotra
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-body text-ink-muted">
                                No gotras found. Members need to set their gotra in their profile.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
