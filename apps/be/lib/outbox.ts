export type OutboxEventParams = {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  topic: string;
};

export type OutboxEventParamsArray = Array<OutboxEventParams>;

/**
 * Creates an outbox event within an existing Prisma transaction.
 * The outbox event commits atomically with the business mutation.
 */
export async function createOutboxEvent(
  tx: any,
  params: OutboxEventParams,
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
  events: OutboxEventParamsArray,
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
