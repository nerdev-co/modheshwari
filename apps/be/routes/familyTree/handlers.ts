/**
 * Family Tree API Handlers
 * HTTP request handlers for family tree endpoints
 */

import { z } from "zod";
import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import getRedisClient from "@modheshwari/redis";

import { validateBody } from "../../lib/validate";
import { requireAuth } from "../authMiddleware";
import type { TreeView, TreeFormat } from "./types";
import {
    buildAncestorTree,
    buildDescendantTree,
    buildFullTree,
} from "./builders";
import { buildGraphData } from "./graph";
import { getReciprocalType } from "./utils";

const FAMILY_TREE_TTL = Number(process.env.FAMILY_TREE_TTL_SECONDS || 60);

/**
 * Performs family tree key operation.
 * @param {string} userId - Description of userId
 * @param {import("/Users/nalindalal/modheshwari/apps/be/routes/familyTree/types").TreeView} view - Description of view
 * @param {number} depth - Description of depth
 * @returns {string} Description of return value
 */
function familyTreeKey(userId: string, view: TreeView, depth: number): string {
    return `familyTree:${userId}:${view}:${depth}`;
}

/**
 * GET /api/family/tree
 * Get family tree for authenticated user
 *
 * Query params:
 * - userId: Target user ID (defaults to authenticated user)
 * - view: 'ancestors' | 'descendants' | 'full' (default: 'full')
 * - depth: How many levels to show (default: 5)
 * - format: 'tree' | 'graph' (default: 'tree')
 */
export async function handleGetFamilyTree(req: Request): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const url = new URL(req.url);
        const userId =
            url.searchParams.get("userId") ||
            auth.payload.userId ||
            auth.payload.id;
        const view = (url.searchParams.get("view") || "full") as TreeView;
        const depth = parseInt(url.searchParams.get("depth") || "5", 10);
        const format = (url.searchParams.get("format") || "tree") as TreeFormat;

        // Validate parameters
        if (!userId) {
            return failure("userId is required", "Validation Error", 400);
        }

        if (!["ancestors", "descendants", "full"].includes(view)) {
            return failure(
                "view must be 'ancestors', 'descendants', or 'full'",
                "Validation Error",
                400,
            );
        }

        if (depth < 1 || depth > 10) {
            return failure(
                "depth must be between 1 and 10",
                "Validation Error",
                400,
            );
        }

        // Fetch user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true },
        });

        if (!user) {
            return failure("User not found", "Not Found", 404);
        }

        // Build tree based on view
        let treeNode = null;

        const redis = await getRedisClient();
        const cacheKey = familyTreeKey(userId, view, depth);
        const cached = await redis.get(cacheKey);

        if (cached) {
            treeNode = JSON.parse(cached);
        } else {
            if (view === "ancestors") {
                treeNode = await buildAncestorTree(userId, depth);
            } else if (view === "descendants") {
                treeNode = await buildDescendantTree(userId, depth);
            } else {
                treeNode = await buildFullTree(userId, depth);
            }

            if (treeNode) {
                await redis.set(cacheKey, JSON.stringify(treeNode), {
                    EX: FAMILY_TREE_TTL,
                });
            }
        }

        if (!treeNode) {
            return failure("Failed to build family tree", "Server Error", 500);
        }

        // Convert to requested format
        const data = format === "graph" ? buildGraphData(treeNode) : treeNode;

        return success("Family tree retrieved", { tree: data }, 200);
    } catch {
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

const CreateRelationshipSchema = z.object({
  targetUserId: z.string().min(1, "targetUserId is required"),
  relationType: z.enum(["SPOUSE", "PARENT", "CHILD", "SIBLING"]),
  reciprocal: z.boolean().optional().default(true),
});

/**
 * POST /api/family/tree/relations
 * Create or update a user relationship
 *
 * Body:
 * {
 *   targetUserId: string,
 *   relationType: 'SPOUSE' | 'PARENT' | 'CHILD' | 'SIBLING',
 *   reciprocal?: boolean
 * }
 */
export async function handleCreateRelationship(
    req: Request,
): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const userId = auth.payload.userId || auth.payload.id;
        const validation = await validateBody(req, CreateRelationshipSchema);
        if (!validation.ok) return validation.response;
        const body = validation.data;

        const { targetUserId, relationType, reciprocal } = body;

        if (userId === targetUserId) {
            return failure(
                "Cannot create self-relation",
                "Validation Error",
                400,
            );
        }

        // Verify both users exist
        const [userExists, targetExists] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true },
            }),
            prisma.user.findUnique({
                where: { id: targetUserId },
                select: { id: true },
            }),
        ]);

        if (!userExists) {
            return failure("Authenticated user not found", "Not Found", 404);
        }

        if (!targetExists) {
            return failure("Target user not found", "Not Found", 404);
        }

        // Check if relation already exists
        const existingRelation = await prisma.userRelation.findFirst({
            where: {
                fromUserId: userId,
                toUserId: targetUserId,
                type: relationType as any,
            },
        });

        if (existingRelation) {
            return failure("Relationship already exists", "Conflict", 409);
        }

        // Create primary relation
        const relation = await prisma.userRelation.create({
            data: {
                fromUserId: userId,
                toUserId: targetUserId,
                type: relationType as any,
            },
        });

        // Create reciprocal if needed
        let reciprocalRelation = null;
        if (reciprocal) {
            const reciprocalType = getReciprocalType(relationType);

            // Check if reciprocal already exists
            const existingReciprocal = await prisma.userRelation.findFirst({
                where: {
                    fromUserId: targetUserId,
                    toUserId: userId,
                    type: reciprocalType as any,
                },
            });

            if (!existingReciprocal) {
                reciprocalRelation = await prisma.userRelation.create({
                    data: {
                        fromUserId: targetUserId,
                        toUserId: userId,
                        type: reciprocalType as any,
                    },
                });
            }
        }

        // Invalidate family tree caches for both users
        const redis = await getRedisClient();
        const views: TreeView[] = ["ancestors", "descendants", "full"];
        for (const view of views) {
            for (const depth of [1, 2, 3, 5, 10]) {
                await redis.del(familyTreeKey(userId, view, depth));
                await redis.del(familyTreeKey(targetUserId, view, depth));
            }
        }

        return success(
            "Relationship created",
            { relation, reciprocalRelation },
            201,
        );
    } catch {
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/**
 * DELETE /api/family/tree/relations/:relationId
 * Remove a relationship
 */
export async function handleDeleteRelationship(
    req: Request,
    relationId: string,
): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        if (!relationId) {
            return failure("relationId is required", "Validation Error", 400);
        }

        // Verify relation exists and user has permission
        const relation = await prisma.userRelation.findUnique({
            where: { id: relationId },
            select: { fromUserId: true, toUserId: true },
        });

        if (!relation) {
            return failure("Relationship not found", "Not Found", 404);
        }

        const userId = auth.payload.userId || auth.payload.id;

        // Allow deletion if user is either side of the relationship
        if (relation.fromUserId !== userId && relation.toUserId !== userId) {
            return failure(
                "Unauthorized to delete this relationship",
                "Forbidden",
                403,
            );
        }

        await prisma.userRelation.delete({
            where: { id: relationId },
        });

        // Invalidate family tree caches for both users
        const redis = await getRedisClient();
        const views: TreeView[] = ["ancestors", "descendants", "full"];
        for (const view of views) {
            for (const depth of [1, 2, 3, 5, 10]) {
                await redis.del(
                    familyTreeKey(relation.fromUserId, view, depth),
                );
                await redis.del(familyTreeKey(relation.toUserId, view, depth));
            }
        }

        return success("Relationship deleted", {}, 200);
    } catch {
        return failure("Internal server error", "Unexpected Error", 500);
    }
}
