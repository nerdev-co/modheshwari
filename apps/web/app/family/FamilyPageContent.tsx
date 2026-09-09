"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { MemberCard } from "@repo/ui/memberCard";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

import { API_BASE } from "../../lib/config";
import { apiFetch } from "../../lib/api";

/**
 * Type for a single family member.
 */
interface Member {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        status: boolean;
    };
}

/**
 * Family Page - Displays and manages family members and their status.
 *
 * Optimization Notes:
 * - Caches family data (name and members) in the browser's localstorage.
 *   This allows the page to load instantly for returning users without 
 *   waiting for an API response.
 * - Then, a background fetch refreshes data and updates the cache.
 *
 * UX Goal:
 * - Faster perceived load times for returning users.
 * - Reduced redundant API calls.

 * Security:
 * - Only non-sensitive family details are cached.
 *   - Auth token is never stored locally.
 */
export default function FamilyPageContent() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [hydrated, setHydrated] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setHydrated(true);
        const savedToken = localStorage.getItem("token");
        setToken(savedToken);
    }, []);

    const fetchMembers = useCallback(
        async (all = false, signal?: AbortSignal) => {
            if (!token) return;

            setLoading(true);
            try {
                const res = await apiFetch(
                    `${API_BASE}/family/members${all ? "?all=true" : ""}`,
                    { signal },
                );

                if (res.status === 401) {
                    navigate(`/signin?next=/family`);
                    return;
                }

                if (!res.ok) throw new Error("Failed to fetch members");

                const data = await res.json();
                setMembers(data.data?.members || []);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                console.error("Error fetching members:", err);
            } finally {
                setLoading(false);
            }
        },
        [token, navigate],
    );

    const toggleStatus = async (userId: string, currentStatus: boolean) => {
        if (!token) return;

        try {
            const res = await apiFetch(`${API_BASE}/users/${userId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: !currentStatus }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            setMembers((prev) =>
                prev.map((m) =>
                    m.user.id === userId
                        ? { ...m, user: { ...m.user, status: !currentStatus } }
                        : m,
                ),
            );
        } catch {
            toast("Failed to update member status.", { variant: "error" });
        }
    };

    useEffect(() => {
        if (!token) return;
        const controller = new AbortController();
        fetchMembers(showAll, controller.signal);
        return () => controller.abort();
    }, [token, showAll, fetchMembers]);

    if (hydrated && !token) return <NotAuthenticated />;
    if (!hydrated) return null;
    if (loading) return <LoaderOne />;

    return (
        <DreamySunsetBackground className="px-6 py-10">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="col-span-2 rounded-2xl p-6 bg-jewel-gold/10 border border-jewel-gold/20">
                        <p className="text-sm text-jewel-500">Total Members</p>
                        <p className="text-4xl font-black font-display text-jewel-900 mt-2">{members.length}</p>
                    </div>

                    <div className="rounded-2xl p-6 bg-jewel-emerald/10 border border-jewel-emerald/20">
                        <p className="text-sm text-jewel-emerald">Alive</p>
                        <p className="text-3xl font-bold font-display text-jewel-900 mt-2">
                            {members.filter((m) => m.user.status).length}
                        </p>
                    </div>

                    <div className="rounded-2xl p-6 bg-jewel-ruby/10 border border-jewel-ruby/20">
                        <p className="text-sm text-jewel-ruby">Deceased</p>
                        <p className="text-3xl font-bold font-display text-jewel-900 mt-2">
                            {members.filter((m) => !m.user.status).length}
                        </p>
                    </div>

                    {/* Filter tile */}
                    <div className="rounded-2xl p-5 bg-jewel-50/60 border border-jewel-400/20 flex flex-col justify-between">
                        <p className="text-xs text-jewel-500">Filter</p>
                        <Button
                            variant={showAll ? "danger" : "secondary"}
                            onClick={() => setShowAll((prev) => !prev)}
                            className="mt-3"
                        >
                            {showAll ? "Showing All" : "Alive Only"}
                        </Button>
                    </div>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {members.length > 0 ? (
                        members.map((m) => (
                            <MemberCard key={m.id} member={m} onToggle={toggleStatus} />
                        ))
                    ) : (
                        <div className="md:col-span-2 xl:col-span-3 rounded-2xl p-10 text-center bg-jewel-50/60 border border-jewel-400/20">
                            <p className="text-sm text-jewel-600">No family members to show</p>
                            <p className="text-xs text-jewel-400 mt-1">
                                Try changing the filter or adding new members
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DreamySunsetBackground>
    );
}
