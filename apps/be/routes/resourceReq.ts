import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { isRateLimited } from "@modheshwari/utils/rateLimit";
import type { ApprovalStatus } from "@prisma/client";
import {
    parsePagination,
    buildPaginationResponse,
} from "@modheshwari/utils/pagination";

import { requireAuth } from "./authMiddleware";
import { broadcastNotification } from "../kafka/notificationProducer";
import { logger } from "../lib/logger";

/* =========================================================
   CREATE RESOURCE REQUEST (RATE LIMITED)
   POST /api/resource-requests
   ========================================================= */

/**
 * Creates a new resource request with a multi-level approval workflow.
 *
 * The request is created in `PENDING` status and approval records
 * are generated for all applicable approvers: COMMUNITY_HEAD,
 * COMMUNITY_SUBHEAD, and the GOTRA_HEAD matching the requester's
 * gotra. The request is approved only when all approvers have
 * approved; any rejection or changes_requested prevents auto-approval.
 *
 * Role-based permissions:
 * - Any authenticated user can create a resource request.
 * - Only COMMUNITY_HEAD, COMMUNITY_SUBHEAD, and GOTRA_HEAD can
 *   review and approve/reject requests.
 *
 * @async
 * @function handleCreateResourceRequest
 * @route POST /api/resource-requests
 * @param {Request} req - The incoming HTTP request. The body must
 *   contain `resource` (string, required) identifying the resource
 *   being requested.
 * @returns {Promise<Response>} JSON response with the created
 *   resource request including its approvals on success, or an
 *   error message with HTTP status code on failure.
 *
 * @example
 * // Create a resource request
 * POST /api/resource-requests
 * {
 *   "resource": "Medical supplies for community event"
 * }
 *
 * // Response (success)
 * {
 *   "message": "Resource request created",
 *   "data": { "request": { "id": "...", "status": "PENDING", ... } }
 * }
 */
export async function handleCreateResourceRequest(
    req: Request,
): Promise<Response> {
    try {
        if (
            isRateLimited(req, {
                max: 5,
                windowMs: 5 * 60_000,
                scope: "resource-create",
            })
        ) {
            return failure("Too many requests", "Rate Limit", 429);
        }

        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const userId = auth.payload.userId ?? auth.payload.id;
        const body = (await req.json().catch(() => null)) as any;

        if (!body?.resource) {
            return failure("Missing resource field", "Validation Error", 400);
        }

        /* -------- Identify approvers -------- */

        const approvers: Array<{ id: string; role: string; name: string | null }> = [];

        const [communityHead, communitySub, profile] = await Promise.all([
            prisma.user.findFirst({
                where: { role: "COMMUNITY_HEAD", status: true },
                select: { id: true, name: true },
            }),
            prisma.user.findFirst({
                where: { role: "COMMUNITY_SUBHEAD", status: true },
                select: { id: true, name: true },
            }),
            prisma.profile.findUnique({
                where: { userId },
                select: { gotra: true },
            }),
        ]);

        if (communityHead) {
            approvers.push({
                id: communityHead.id,
                role: "COMMUNITY_HEAD",
                name: communityHead.name,
            });
        }

        if (communitySub) {
            approvers.push({
                id: communitySub.id,
                role: "COMMUNITY_SUBHEAD",
                name: communitySub.name,
            });
        }

        let gotraHead: { id: string; name: string } | null = null;

        if (profile?.gotra) {
            gotraHead = await prisma.user.findFirst({
                where: {
                    role: "GOTRA_HEAD",
                    status: true,
                    profile: { gotra: profile.gotra },
                },
                select: { id: true, name: true },
            });
        }

        if (gotraHead) {
            approvers.push({
                id: gotraHead.id,
                role: "GOTRA_HEAD",
                name: gotraHead.name,
            });
        }

        /* -------- Transaction -------- */

        // Look up or create a Resource by name so resourceId is a valid FK
        const resourceName = body.resource.trim();
        const resource = await prisma.resource.upsert({
            where: { name_type: { name: resourceName, type: "GENERAL" } },
            update: {},
            create: { name: resourceName, type: "GENERAL", description: resourceName },
        });

        const created = await prisma.$transaction(async (tx) => {
            const rr = await tx.resourceRequest.create({
                data: {
                    userId,
                    resourceId: resource.id,
                    status: "PENDING",
                },
            });

            for (const a of approvers) {
                await tx.resourceRequestApproval.create({
                    data: {
                        requestId: rr.id,
                        approverId: a.id,
                        approverName: a.name ?? "",
                        role: a.role as any,
                        status: "PENDING",
                    },
                });

                await tx.notification.create({
                    data: {
                        userId: a.id,
                        type: "RESOURCE_REQUEST",
                        message: `New resource request from ${auth.payload.name ?? "a user"
                            }: ${body.resource}`,
                    },
                });
            }

            return tx.resourceRequest.findUnique({
                where: { id: rr.id },
                include: { approvals: true },
            });
        });

        return success("Resource request created", { request: created }, 201);
    } catch (err) {
        logger.error("Create ResourceRequest Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/* =========================================================
   LIST RESOURCE REQUESTS
   GET /api/resource-requests
   ========================================================= */

/**
 * Lists resource requests with pagination and optional status filtering.
 *
 * Role-based permissions:
 * - COMMUNITY_HEAD, COMMUNITY_SUBHEAD, and GOTRA_HEAD can view
 *   all requests (admin scope).
 * - Other roles can only view their own requests.
 *
 * @async
 * @function handleListResourceRequests
 * @route GET /api/resource-requests
 * @param {Request} req - The incoming HTTP request. Supports
 *   query parameters `status` (filter by approval status),
 *   `page` (pagination page), and `limit` (items per page, max 100).
 * @returns {Promise<Response>} JSON response with a paginated
 *   list of resource requests and their approvals on success, or
 *   an error message with HTTP status code on failure.
 */
export async function handleListResourceRequests(
    req: Request,
): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const payload = auth.payload;
        const url = new URL(req.url);
        const status = url.searchParams.get("status") || undefined;

        // Parse pagination
        const { skip, take, page, limit } = parsePagination(
            {
                page: url.searchParams.get("page"),
                limit: url.searchParams.get("limit"),
            },
            20,
            100,
        );

        const adminRoles = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];
        const where: any = {};

        if (status) where.status = status;
        if (!adminRoles.includes(payload.role)) {
            where.userId = payload.userId ?? payload.id;
        }

        // Get total count
        const total = await prisma.resourceRequest.count({ where });

        // Get paginated results
        const list = await prisma.resourceRequest.findMany({
            where,
            include: {
                approvals: {
                    select: { id: true, status: true, approverName: true, role: true, reviewedAt: true, remarks: true },
                },
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        });

        return success(
            "Requests fetched",
            buildPaginationResponse(list, total, page, limit),
            200,
        );
    } catch (err) {
        logger.error("List ResourceRequests Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/* =========================================================
   GET SINGLE RESOURCE REQUEST
   ========================================================= */

/**
 * Retrieves a single resource request by ID with its approvals.
 *
 * Role-based permissions:
 * - COMMUNITY_HEAD, COMMUNITY_SUBHEAD, and GOTRA_HEAD can
 *   view any request.
 * - Other roles can only view their own requests.
 *
 * @async
 * @function handleGetResourceRequest
 * @route GET /api/resource-requests/:id
 * @param {Request} req - The incoming HTTP request.
 * @param {string} id - The UUID of the resource request to retrieve.
 * @returns {Promise<Response>} JSON response with the resource
 *   request and its approvals on success, or an error message
 *   with HTTP status code on failure.
 */
export async function handleGetResourceRequest(
    req: Request,
    id: string,
): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const r = await prisma.resourceRequest.findUnique({
            where: { id },
            include: {
                approvals: {
                    select: { id: true, status: true, approverName: true, role: true, reviewedAt: true, remarks: true },
                },
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
        });

        if (!r) return failure("Request not found", "Not Found", 404);

        const adminRoles = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];
        const payload = auth.payload;

        if (!adminRoles.includes(payload.role)) {
            const uid = payload.userId ?? payload.id;
            if (r.userId !== uid) {
                return failure("Forbidden", "Forbidden", 403);
            }
        }

        return success("Request fetched", { request: r }, 200);
    } catch (err) {
        logger.error("Get ResourceRequest Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/* =========================================================
   REVIEW RESOURCE REQUEST (RATE LIMITED)
   POST /api/resource-requests/:id/review
   ========================================================= */

/**
 * Reviews a resource request by recording the authenticated
 * reviewer's decision.
 *
 * Implements the multi-level approval workflow: the request
 * transitions through PENDING → APPROVED/REJECTED/CHANGES_REQUESTED
 * based on the collective decisions of all approvers. The overall
 * status is determined as follows:
 * - If any approver sets REJECTED, the overall status becomes REJECTED.
 * - If all approvers set APPROVED, the overall status becomes APPROVED.
 * - If any approver sets CHANGES_REQUESTED (and none have rejected),
 *   the overall status becomes CHANGES_REQUESTED.
 * - Otherwise, the status remains PENDING.
 *
 * When the request is fully approved, an email notification is
 * broadcast via Kafka.
 *
 * Role-based permissions:
 * - Only COMMUNITY_HEAD, COMMUNITY_SUBHEAD, and GOTRA_HEAD can
 *   review resource requests.
 *
 * @async
 * @function handleReviewResourceRequest
 * @route POST /api/resource-requests/:id/review
 * @param {Request} req - The incoming HTTP request. The body must
 *   contain `action` (`"approve"`, `"reject"`, or `"changes"`)
 *   and an optional `remarks` string.
 * @param {string} id - The UUID of the resource request to review.
 * @returns {Promise<Response>} JSON response confirming the
 *   review was recorded, or an error message with HTTP status code.
 *
 * @example
 * // Approve a resource request
 * POST /api/resource-requests/:id/review
 * {
 *   "action": "approve",
 *   "remarks": "All checks passed"
 * }
 *
 * // Response (success)
 * {
 *   "message": "Review recorded",
 *   "data": null
 * }
 */
export async function handleReviewResourceRequest(
    req: Request,
    id: string,
): Promise<Response> {
    try {
        if (
            isRateLimited(req, {
                max: 10,
                windowMs: 60_000,
                scope: "resource-review",
            })
        ) {
            return failure("Too many requests", "Rate Limit", 429);
        }

        const auth = requireAuth(req, [
            "COMMUNITY_HEAD",
            "COMMUNITY_SUBHEAD",
            "GOTRA_HEAD",
        ]);
        if (!auth.ok) return auth.response as Response;

        const reviewerId = auth.payload.userId ?? auth.payload.id;
        const reviewerName = auth.payload.name ?? null;
        const body = (await req.json().catch(() => null)) as any;

        if (!body?.action) {
            return failure("Missing action", "Validation Error", 400);
        }

        const statusMap: Record<string, ApprovalStatus> = {
            approve: "APPROVED",
            reject: "REJECTED",
            changes: "CHANGES_REQUESTED",
        };

        const newStatus = statusMap[body.action];
        if (!newStatus) {
            return failure("Invalid action", "Bad Request", 400);
        }

        const reqRow = await prisma.$transaction(async (tx) => {
            const approval = await tx.resourceRequestApproval.findFirst({
                where: { requestId: id, approverId: reviewerId },
            });

            if (!approval) throw new Error("NOT_AUTHORIZED");

            await tx.resourceRequestApproval.update({
                where: { id: approval.id },
                data: {
                    status: newStatus,
                    remarks: body.remarks ?? null,
                    reviewedAt: new Date(),
                },
            });

            const approvals = await tx.resourceRequestApproval.findMany({
                where: { requestId: id },
            });

            let overall: ApprovalStatus = "PENDING";
            if (
                approvals.some(
                    (a: (typeof approvals)[number]) => a.status === "REJECTED",
                )
            )
                overall = "REJECTED";
            else if (
                approvals.every(
                    (a: (typeof approvals)[number]) => a.status === "APPROVED",
                )
            )
                overall = "APPROVED";
            else if (
                approvals.some(
                    (a: (typeof approvals)[number]) => a.status === "CHANGES_REQUESTED",
                )
            )
                overall = "CHANGES_REQUESTED";

            const reqRow = await tx.resourceRequest.update({
                where: { id },
                data: {
                    status: overall,
                    approverId: reviewerId,
                    approverName: reviewerName,
                },
            });

            await tx.notification.create({
                data: {
                    userId: reqRow.userId,
                    type: "RESOURCE_REQUEST",
                    message: `Your resource request status changed to ${overall}`,
                },
            });
            return reqRow;
        });

        // If request is fully approved, also broadcast an email notification via Kafka
        try {
            if (reqRow && reqRow.status === "APPROVED") {
                await broadcastNotification({
                    message: `Your resource request has been approved.`,
                    type: "RESOURCE_REQUEST",
                    channels: ["EMAIL", "IN_APP"],
                    subject: "Resource Request Approved",
                    recipientIds: [reqRow.userId],
                    senderId: reviewerId,
                    priority: "normal",
                    deliveryStrategy: "BROADCAST",
                    notificationPriority: "MEDIUM",
                });
            }
        } catch (err) {
            logger.error("Failed to broadcast approval notification:", err);
        }

        return success("Review recorded", null, 200);
    } catch (err: any) {
        if (err.message === "NOT_AUTHORIZED") {
            return failure("Not your approval", "Forbidden", 403);
        }

        logger.error("Review ResourceRequest Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}
