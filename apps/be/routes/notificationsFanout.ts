import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { z } from "zod";

import { requireAuth } from "./authMiddleware";
import resolveRecipients from "../utils/recipientResolver";
import { TOPICS } from "../kafka/config";
import { createOutboxEvent } from "../lib/outbox";
import { logger } from "../lib/logger";
import { validateBody } from "../lib/validate";
import { NotificationChannelSchema } from "../lib/sharedSchemas";

const ScopeSchema = z.enum(["gotra", "community", "family"]);

const FanoutNotificationSchema = z.object({
    scope: ScopeSchema,
    scopeValue: z.string().min(1, "scopeValue is required"),
    message: z.string().min(1, "Message is required"),
    channels: z.array(NotificationChannelSchema).optional().default(["IN_APP"]),
    roleFilter: z.array(z.string()).optional(),
    preview: z.boolean().optional().default(false),
    priority: z.string().optional().default("normal"),
});

type Scope = "gotra" | "community" | "family";

/**
 * POST /api/notifications/fanout
 * body: { scope, scopeValue, message, channels, roleFilter?, preview?, priority? }
 */
export async function handleFanoutNotification(req: Request) {
    try {
        const auth = requireAuth(req, [
            "COMMUNITY_HEAD",
            "COMMUNITY_SUBHEAD",
            "GOTRA_HEAD",
            "FAMILY_HEAD",
        ]);

        if (!auth.ok) return auth.response as Response;

        const v = await validateBody(req, FanoutNotificationSchema);
        if (!v.ok) return v.response;
        const body = v.data;

        const {
            scope,
            scopeValue,
            message,
            channels = ["IN_APP"],
            roleFilter,
            preview = false,
            priority = "normal",
        } = body;

        // Cap recipients to avoid accidental blasts
        const MAX_RECIPIENTS = 20000;

        const resolved = await resolveRecipients({
            prisma,
            scope: scope as Scope,
            scopeValue: String(scopeValue),
            roleFilter: Array.isArray(roleFilter) ? roleFilter : undefined,
            onlyActive: true,
            limit: MAX_RECIPIENTS,
        });

        if (!resolved || resolved.count === 0)
            return failure("No recipients found", "Not Found", 404);

        if (preview) {
            const sample = resolved.recipients
                .slice(0, 5)
                .map((r) => ({ id: r.id, email: r.email }));
            return success(
                "Preview",
                { recipientCount: resolved.count, sample },
                200,
            );
        }

        // Enqueue fanout event to Kafka via outbox
        const senderId = auth.payload.userId;
        const fanoutId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        await prisma.$transaction(async (tx) => {
            await createOutboxEvent(tx, {
                eventType: "notification.fanout",
                aggregateType: "Fanout",
                aggregateId: fanoutId,
                payload: {
                    fanoutId,
                    initiatedBy: senderId,
                    recipientIds: resolved.recipients.map((r) => r.id),
                    channels,
                    message,
                    priority,
                },
                topic: TOPICS.NOTIFICATION_EVENTS,
            });
        });

        return success(
            "Fanout queued",
            { recipientCount: resolved.count },
            202,
        );
    } catch (err) {
        logger.error("Fanout Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}
