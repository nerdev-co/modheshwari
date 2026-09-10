import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { z } from "zod";

import { validateBody } from "../lib/validate";
import { EventStatusSchema } from "../lib/sharedSchemas";
import { requireAuth } from "./authMiddleware";
import { logger } from "../lib/logger";
import { createOutboxEvent } from "../lib/outbox";

const UpdateEventStatusSchema = z.object({
    status: EventStatusSchema,
});

const ADMIN_ROLES = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];

/**
 * GET /api/admin/requests
 * Lists all user-generated requests (resource requests and events).
 */
export async function handleListAllRequests(req: any): Promise<Response> {
    try {
        const auth = requireAuth(req as Request, ADMIN_ROLES);
        if (!auth.ok) return auth.response as Response;

        // Resource requests (include approvals and requester)
        const resourceRequests = await prisma.resourceRequest.findMany({
            include: {
                approvals: {
                    select: {
                        id: true,
                        status: true,
                        approverName: true,
                        role: true,
                        reviewedAt: true,
                        remarks: true,
                    },
                },
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Events (include approvals and creator)
        const events = await prisma.event.findMany({
            include: {
                approvals: {
                    select: {
                        id: true,
                        status: true,
                        approverName: true,
                        role: true,
                        reviewedAt: true,
                        remarks: true,
                    },
                },
                createdBy: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return success(
            "Admin requests fetched",
            { resourceRequests, events },
            200,
        );
    } catch (err) {
        logger.error("ListAllRequests Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/**
 * POST /api/admin/events/:id/status
 * Body: { status: "APPROVED" | "REJECTED" | "CANCELLED" }
 */
export async function handleUpdateEventStatus(
    req: Request,
    id: string,
): Promise<Response> {
    try {
        const auth = requireAuth(req, ADMIN_ROLES);
        if (!auth.ok) return auth.response as Response;

        const v = await validateBody(req, UpdateEventStatusSchema);
        if (!v.ok) return v.response;
        const body = v.data;

        const status = body.status;

        const ev = await prisma.event.findUnique({ where: { id } });
        if (!ev) return failure("Event not found", "Not Found", 404);

        const updated = await prisma.$transaction(async (tx) => {
            const ev = await tx.event.update({
                where: { id },
                data: { status },
            });

            await createOutboxEvent(tx, {
                eventType: "event.updated",
                aggregateType: "Event",
                aggregateId: id,
                payload: {
                    id: ev.id,
                    name: ev.name,
                    description: ev.description,
                    date: ev.date.toISOString(),
                    venue: ev.venue,
                    status: status as any,
                },
                topic: "elasticsearch.indexing",
            });

            // Notify event creator
            await tx.notification.create({
                data: {
                    userId: ev.createdById,
                    type: "EVENT_APPROVAL",
                    message: `Your event '${ev.name}' status changed to ${status}`,
                },
            });

            return ev;
        });

        return success("Event status updated", { event: updated }, 200);
    } catch (err) {
        logger.error("UpdateEventStatus Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}
