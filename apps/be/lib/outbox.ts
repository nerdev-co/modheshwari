import prisma from "@modheshwari/db";
import { randomUUID } from "crypto";

/**
 * Creates an outbox event within an existing Prisma transaction.
 * The outbox event commits atomically with the business mutation.
 */
export async function createOutboxEvent(
  tx: any,
  params: {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    topic: string;
  },
) {
  await tx.outboxEvent.create({
    data: {
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      payload: params.payload,
      topic: params.topic,
    },
  });
}

/**
 * Creates multiple outbox events within an existing Prisma transaction.
 */
export async function createOutboxEvents(
  tx: any,
  events: Array<{
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    topic: string;
  }>,
) {
  if (events.length === 0) return;
  await tx.outboxEvent.createMany({
    data: events.map((e) => ({
      eventType: e.eventType,
      aggregateType: e.aggregateType,
      aggregateId: e.aggregateId,
      payload: e.payload,
      topic: e.topic,
    })),
  });
}
