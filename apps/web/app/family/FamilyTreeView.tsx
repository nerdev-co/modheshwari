"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Network } from "vis-network";
import { Plus, Loader } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

import { API_BASE } from "../../lib/config";
import { apiFetch } from "../../lib/api";
import { useLocale } from "../../lib/LocaleContext";

interface GraphData {
    nodes: Array<{
        id: string;
        label: string;
        title?: string;
        color?: string;
        shape?: string;
    }>;
    edges: Array<{
        from: string;
        to: string;
        label: string;
        arrows?: string;
    }>;
}

type ViewType = "ancestors" | "descendants" | "full";

/**
 * Performs  family tree view operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function FamilyTreeView() {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);
    const { t } = useLocale();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<ViewType>("full");
    const [depth, setDepth] = useState(5);
    const [userId, setUserId] = useState<string | null>(null);
    const [treeData, setTreeData] = useState<GraphData | null>(null);
    const [relationshipForm, setRelationshipForm] = useState({
        targetUserId: "",
        relationType: "SPOUSE" as "SPOUSE" | "PARENT" | "CHILD" | "SIBLING",
        reciprocal: true,
    });
    const [showRelationshipForm, setShowRelationshipForm] = useState(false);

    const fetchFamilyTree = async () => {
        if (!userId) {
            setError(t("familyTree.userIdNotAvailable"));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                userId,
                view,
                depth: depth.toString(),
                format: "graph",
            });

            const data = await apiFetch(`${API_BASE}/family/tree?${params}`);
            const tree = data?.data?.tree;
            if (!tree) {
                setTreeData({ nodes: [], edges: [] });
                return;
            }
            setTreeData(tree);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("familyTree.unknownError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!treeData || !containerRef.current) return;

        const options = {
            physics: {
                enabled: true,
                stabilization: {
                    iterations: 200,
                },
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    levelSeparation: 200,
                    nodeSpacing: 150,
                    direction: "UD",
                },
            },
            nodes: {
                font: {
                    size: 14,
                    face: "Tahoma",
                },
                borderWidth: 2,
                borderWidthSelected: 4,
            },
            edges: {
                font: {
                    size: 12,
                    align: "middle",
                },
                smooth: {
                    enabled: true,
                    type: "continuous",
                    roundness: 0.5,
                },
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.5,
                    },
                },
            },
        };

        networkRef.current = new Network(containerRef.current, treeData, options);
    }, [treeData]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const parts = token.split(".");
            if (parts.length < 2) return;

            const payload = JSON.parse(atob(parts[1]!));
            setUserId(payload.userId || payload.id);
        } catch (err) {
            console.error("Failed to decode token:", err);
        }
    }, []);

    const handleCreateRelationship = async () => {
        if (!relationshipForm.targetUserId) {
            setError(t("familyTree.enterUserId"));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiFetch(`${API_BASE}/family/tree/relations`, {
                method: "POST",
                body: JSON.stringify(relationshipForm),
            });

            setRelationshipForm({
                targetUserId: "",
                relationType: "SPOUSE",
                reciprocal: true,
            });
            setShowRelationshipForm(false);

            await fetchFamilyTree();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("familyTree.unknownError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen px-6 py-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Controls */}
                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* View Type */}
                        <div>
                            <label htmlFor="viewType" className="block text-sm font-medium text-ink-muted mb-2">
                                {t("familyTree.viewType")}
                            </label>
                            <select
                                id="viewType"
                                value={view}
                                onChange={(e) => setView(e.target.value as ViewType)}
                                className="select"
                            >
                                <option value="full">{t("familyTree.fullTree")}</option>
                                <option value="ancestors">{t("familyTree.ancestors")}</option>
                                <option value="descendants">{t("familyTree.descendants")}</option>
                            </select>
                        </div>

                        {/* Depth */}
                        <div>
                            <label htmlFor="depth" className="block text-sm font-medium text-ink-muted mb-2">
                                {t("familyTree.depth")}: {depth}
                            </label>
                            <input
                                id="depth"
                                type="range"
                                min="1"
                                max="10"
                                value={depth}
                                onChange={(e) => setDepth(parseInt(e.target.value))}
                                className="w-full accent-saffron"
                            />
                        </div>

                        {/* Refresh Button */}
                        <div className="flex items-end">
                            <Button
                                onClick={fetchFamilyTree}
                                disabled={loading || !userId}
                                className="w-full"
                            >
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                {t("familyTree.refreshTree")}
                            </Button>
                        </div>

                        {/* Add Relationship Button */}
                        <div className="flex items-end">
                            <Button
                                variant="secondary"
                                onClick={() => setShowRelationshipForm(!showRelationshipForm)}
                                className="w-full"
                            >
                                <Plus className="w-4 h-4" />
                                {t("familyTree.addRelation")}
                            </Button>
                        </div>
                    </div>

                    {/* Add Relationship Form */}
                    {showRelationshipForm && (
                        <div className="border-t border-border pt-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="targetUserId" className="block text-sm font-medium text-ink-muted mb-2">
                                        {t("familyTree.targetUserId")}
                                    </label>
                                    <input
                                        id="targetUserId"
                                        type="text"
                                        value={relationshipForm.targetUserId}
                                        onChange={(e) =>
                                            setRelationshipForm({
                                                ...relationshipForm,
                                                targetUserId: e.target.value,
                                            })
                                        }
                                        placeholder={t("familyTree.enterUserId")}
                                        className="w-full px-3 py-2 bg-canvas border border-border rounded-xl text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-saffron"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="relationType" className="block text-sm font-medium text-ink-muted mb-2">
                                        {t("familyTree.relationshipType")}
                                    </label>
                                    <select
                                        id="relationType"
                                        value={relationshipForm.relationType}
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                            setRelationshipForm({
                                                ...relationshipForm,
                                                relationType: e.target.value as "SPOUSE" | "PARENT" | "CHILD" | "SIBLING",
                                            })
                                        }
                                        className="select"
                                    >
                                        <option value="SPOUSE">{t("familyTree.spouse")}</option>
                                        <option value="PARENT">{t("familyTree.parent")}</option>
                                        <option value="CHILD">{t("familyTree.child")}</option>
                                        <option value="SIBLING">{t("familyTree.sibling")}</option>
                                    </select>
                                </div>

                                <div className="flex items-end gap-2">
                                    <Button
                                        onClick={handleCreateRelationship}
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        {t("familyTree.add")}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowRelationshipForm(false)}
                                        className="px-4"
                                    >
                                        {t("familyTree.cancel")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-ruby-soft border border-ruby/30 rounded-xl text-ruby text-sm">
                            {error}
                        </div>
                    )}
                </Card>

                {/* Tree Visualization */}
                <Card className="overflow-hidden">
                    <div
                        ref={containerRef}
                        className="w-full bg-surface-muted"
                        style={{ height: "600px", minHeight: "600px" }}
                    />
                </Card>

                {/* Legend */}
                <Card className="p-6">
                    <h3 className="text-lg font-display-bold text-ink mb-4">{t("familyTree.legend")}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { color: "bg-ruby", label: t("role.community_head") },
                            { color: "bg-saffron", label: t("role.community_subhead") },
                            { color: "bg-emerald", label: t("role.gotra_head") },
                            { color: "bg-saffron", label: t("role.family_head") },
                            { color: "bg-ink-muted", label: t("role.member") },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div
                                    className={`w-6 h-6 rounded ${color}`}
                                />
                                <span className="text-sm text-ink-secondary">{label}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Instructions */}
                <div className="bg-saffron-soft border border-saffron/30 rounded-2xl p-4">
                    <h3 className="font-display-bold text-ink mb-2">{t("familyTree.howToUse")}</h3>
                    <ul className="text-sm text-ink-secondary space-y-1 list-disc list-inside">
                        <li>{t("familyTree.instructions.pan")}</li>
                        <li>{t("familyTree.instructions.zoom")}</li>
                        <li>{t("familyTree.instructions.select")}</li>
                        <li>{t("familyTree.instructions.viewType")}</li>
                        <li>{t("familyTree.instructions.depth")}</li>
                        <li>{t("familyTree.instructions.addRelation")}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
