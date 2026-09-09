"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Network } from "vis-network";
import { Plus, Loader } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

import { API_BASE } from "../../lib/config";
import { apiFetch } from "../../lib/api";

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

export default function FamilyTreeView() {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);

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

    // Fetch family tree
    const fetchFamilyTree = async () => {
        if (!userId) {
            setError("User ID not available");
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
            setError(err instanceof Error ? err.message : "Unknown error");
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
            setError("Please enter target user ID");
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
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DreamySunsetBackground className="px-6 py-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Controls */}
                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* View Type */}
                        <div>
                            <label className="block text-sm font-medium text-jewel-600 mb-2">
                                View Type
                            </label>
                            <select
                                value={view}
                                onChange={(e) => setView(e.target.value as ViewType)}
                                className="w-full px-4 py-2 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                            >
                                <option value="full">Full Tree</option>
                                <option value="ancestors">Ancestors</option>
                                <option value="descendants">Descendants</option>
                            </select>
                        </div>

                        {/* Depth */}
                        <div>
                            <label className="block text-sm font-medium text-jewel-600 mb-2">
                                Depth: {depth}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={depth}
                                onChange={(e) => setDepth(parseInt(e.target.value))}
                                className="w-full accent-jewel-gold"
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
                                Refresh Tree
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
                                Add Relation
                            </Button>
                        </div>
                    </div>

                    {/* Add Relationship Form */}
                    {showRelationshipForm && (
                        <div className="border-t border-jewel-400/20 pt-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-jewel-600 mb-2">
                                        Target User ID
                                    </label>
                                    <input
                                        type="text"
                                        value={relationshipForm.targetUserId}
                                        onChange={(e) =>
                                            setRelationshipForm({
                                                ...relationshipForm,
                                                targetUserId: e.target.value,
                                            })
                                        }
                                        placeholder="Enter user ID"
                                        className="w-full px-3 py-2 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-jewel-600 mb-2">
                                        Relationship Type
                                    </label>
                                    <select
                                        value={relationshipForm.relationType}
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                            setRelationshipForm({
                                                ...relationshipForm,
                                                relationType: e.target.value as "SPOUSE" | "PARENT" | "CHILD" | "SIBLING",
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-jewel-50/50 border border-jewel-400/30 rounded-xl text-jewel-900 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
                                    >
                                        <option value="SPOUSE">Spouse</option>
                                        <option value="PARENT">Parent</option>
                                        <option value="CHILD">Child</option>
                                        <option value="SIBLING">Sibling</option>
                                    </select>
                                </div>

                                <div className="flex items-end gap-2">
                                    <Button
                                        onClick={handleCreateRelationship}
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        Add
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowRelationshipForm(false)}
                                        className="px-4"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-jewel-ruby/10 border border-jewel-ruby/30 rounded-xl text-jewel-ruby text-sm">
                            {error}
                        </div>
                    )}
                </Card>

                {/* Tree Visualization */}
                <Card className="overflow-hidden">
                    <div
                        ref={containerRef}
                        className="w-full bg-jewel-100/40"
                        style={{ height: "600px", minHeight: "600px" }}
                    />
                </Card>

                {/* Legend */}
                <Card className="p-6">
                    <h3 className="text-lg font-display font-bold text-jewel-900 mb-4">Legend</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { color: "bg-jewel-ruby", label: "Community Head" },
                            { color: "bg-jewel-saffron", label: "Community Subhead" },
                            { color: "bg-jewel-emerald", label: "Gotra Head" },
                            { color: "bg-jewel-gold", label: "Family Head" },
                            { color: "bg-jewel-400", label: "Member" },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div
                                    className={`w-6 h-6 rounded ${color}`}
                                />
                                <span className="text-sm text-jewel-700">{label}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Instructions */}
                <div className="bg-jewel-gold/10 border border-jewel-gold/30 rounded-2xl p-4">
                    <h3 className="font-display font-bold text-jewel-800 mb-2">How to Use:</h3>
                    <ul className="text-sm text-jewel-600 space-y-1 list-disc list-inside">
                        <li>Click and drag to pan around the tree</li>
                        <li>Scroll to zoom in and out</li>
                        <li>Click a node to select it</li>
                        <li>Use the View Type selector to switch between different tree views</li>
                        <li>Adjust Depth to show more or fewer generations</li>
                        <li>Add relationships using the Add Relation button</li>
                    </ul>
                </div>
            </div>
        </DreamySunsetBackground>
    );
}
