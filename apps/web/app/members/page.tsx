"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";
import { LoaderOne } from "@repo/ui/loading";

import { useLocale } from "../../lib/LocaleContext";
import { useUser } from "../../lib/UserContext";
import { apiFetch } from "../../lib/api";
import { API_BASE } from "../../lib/config";

type Member = {
    id: string;
    name: string;
    email: string;
    role: string;
    profile?: {
        gotra?: string;
        profession?: string;
        location?: string;
    } | null;
    families?: {
        family: { name: string };
    }[];
};

/**
 * Performs  members page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function MembersPage() {
    const navigate = useNavigate();
    const { t } = useLocale();
    const { user } = useUser();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user) {
            navigate("/signin");
            return;
        }
        const fetchMembers = async () => {
            try {
                const res = await apiFetch(`${API_BASE}/search?q=${encodeURIComponent(search || "role:")}`, { throwOnError: false });
                if (res?.data?.data) {
                    setMembers(res.data.data);
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [user, navigate, search]);

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
                    <h1 className="font-display text-[36px] font-semibold leading-tight text-ink">
                        {t("nav.members")}
                    </h1>
                    <p className="text-[15px] text-ink-secondary mt-1">
                        Community members
                    </p>
                </motion.div>

                <div className="h-px bg-border" />

                <div className="py-10">
                    <div className="mb-6">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("common.searchPlaceholder")}
                            className="w-full max-w-md px-4 py-2 text-sm border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron"
                        />
                    </div>

                    {members.length > 0 ? (
                        <div className="space-y-0">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between py-4 border-b border-border-subtle last:border-0"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-saffron-soft text-saffron text-sm font-semibold">
                                            {member.name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-medium text-ink">
                                                {member.name}
                                            </p>
                                            <p className="text-[12px] text-ink-muted">
                                                {member.profile?.gotra || member.role?.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[12px] text-ink-muted">
                                            {member.families?.[0]?.family?.name || "No family"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[14px] text-ink-muted">
                            {search ? "No members found" : "No members yet"}
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}
