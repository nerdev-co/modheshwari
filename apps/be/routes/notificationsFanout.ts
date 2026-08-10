import prisma from '@modheshwari/db';
import { success, failure } from '@modheshwari/utils/response';

import { requireAuth } from './authMiddleware';
import resolveRecipients from '../utils/recipientResolver';
import { TOPICS } from '../kafka/config';
import { createOutboxEvent } from '../lib/outbox';

type Scope = 'gotra' | 'community' | 'family';

interface FanoutBody {
  scope?: string;
  scopeValue?: string;
  message?: string;
  channels?: string[];
  roleFilter?: string[];
  preview?: boolean;
  priority?: string;
}

/**
 * POST /api/notifications/fanout
 * body: { scope, scopeValue, message, channels, roleFilter?, preview?, priority? }
 */
export async function handleFanoutNotification(req: Request) {
    try {
        const auth = requireAuth(req, [
            'COMMUNITY_HEAD',
            'COMMUNITY_SUBHEAD',
            'GOTRA_HEAD',
            'FAMILY_HEAD',
        ]);

        if (!auth.ok) return auth.response as Response;

        const raw: unknown = await req.json().catch(() => null);
        if (!raw || typeof raw !== 'object') return failure('Invalid body', 'Validation Error', 400);

        const body = raw as FanoutBody;
        const {
            scope,
            scopeValue,
            message,
            channels = ['IN_APP'],
            roleFilter,
            preview = false,
            priority = 'normal',
        } = body;

        if (!scope || !scopeValue || !message) return failure('Missing required fields', 'Validation Error', 400);
        if (!['gotra', 'community', 'family'].includes(scope)) return failure('Invalid scope', 'Validation Error', 400);

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

        if (!resolved || resolved.count === 0) return failure('No recipients found', 'Not Found', 404);

        if (preview) {
            const sample = resolved.recipients.slice(0, 5).map((r) => ({ id: r.id, email: r.email }));
            return success('Preview', { recipientCount: resolved.count, sample }, 200);
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

        return success('Fanout queued', { recipientCount: resolved.count }, 202);
    } catch (err) {
        console.error('Fanout Error:', err);
        return failure('Internal server error', 'Unexpected Error', 500);
    }
}
