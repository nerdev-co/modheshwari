import prisma from "@modheshwari/db";

// Register Prisma middleware to enqueue Elasticsearch indexing events in the outbox.
// The outbox relay will pick these up and perform the actual indexing, providing
// retry and durability guarantees.
/**
 * Performs register prisma index hooks operation.
 * @returns {void} Description of return value
 */
export function registerPrismaIndexHooks() {
    // Prisma middleware typing is intentionally loose; this hook only observes
    // mutations on User/Event and enqueues outbox entries. It never mutates
    // the in-flight transaction result.
    (prisma as unknown as { $use: (handler: (params: unknown, next: (params: unknown) => Promise<unknown>) => void) => void }).$use(async (params, next) => {
        const result = await next(params);

        try {
            const model = typeof params === 'object' && params && 'model' in params ? (params as { model?: string }).model : undefined;
            const action = typeof params === 'object' && params && 'action' in params ? (params as { action?: string }).action : undefined;

            if (!model || !result) return result;

            // User model
            if (model === "User") {
                if (action === "create" || action === "update" || action === "upsert") {
                    const user = result as Record<string, unknown>;
                    const profile = (user.profile ?? {}) as Record<string, unknown>;
                    const payload: Record<string, unknown> = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: profile.phone ?? null,
                        role: user.role,
                        profile: {
                          gotra: profile.gotra ?? null,
                          profession: profile.profession ?? null,
                          bloodGroup: profile.bloodGroup ?? null,
                          location: profile.location ?? null,
                        },
                        locationLat: user.locationLat ?? null,
                        locationLng: user.locationLng ?? null,
                    };

                    const serializedPayload = JSON.parse(JSON.stringify(payload));

                    await prisma.outboxEvent.create({
                        data: {
                            eventType: "user.updated",
                            aggregateType: "User",
                            aggregateId: String(user.id),
                            payload: serializedPayload,
                            topic: "elasticsearch.indexing",
                        },
                    });
                } else if (action === "delete") {
                    await prisma.outboxEvent.create({
                        data: {
                            eventType: "user.deleted",
                            aggregateType: "User",
                            aggregateId: String((result as Record<string, unknown>).id),
                            payload: JSON.parse(JSON.stringify({ id: (result as Record<string, unknown>).id })),
                            topic: "elasticsearch.indexing",
                        },
                    });
                }
            }

            // Event model
            if (model === "Event") {
                if (action === "create" || action === "update" || action === "upsert") {
                    const ev = result as Record<string, unknown>;
                    const payload: Record<string, unknown> = {
                        id: ev.id,
                        name: ev.name,
                        description: ev.description,
                        date: typeof ev.date === 'string' ? ev.date : new Date(ev.date as Date).toISOString(),
                        venue: ev.venue,
                        status: ev.status,
                        locationLat: ev.locationLat ?? null,
                        locationLng: ev.locationLng ?? null,
                    };

                    const serializedPayload = JSON.parse(JSON.stringify(payload));

                    await prisma.outboxEvent.create({
                        data: {
                            eventType: "event.updated",
                            aggregateType: "Event",
                            aggregateId: String(ev.id),
                            payload: serializedPayload,
                            topic: "elasticsearch.indexing",
                        },
                    });
                } else if (action === "delete") {
                    await prisma.outboxEvent.create({
                        data: {
                            eventType: "event.deleted",
                            aggregateType: "Event",
                            aggregateId: String((result as Record<string, unknown>).id),
                            payload: JSON.parse(JSON.stringify({ id: (result as Record<string, unknown>).id })),
                            topic: "elasticsearch.indexing",
                        },
                    });
                }
            }
        } catch (err) {
            console.error("Prisma index hook error:", err);
        }

        return result;
    });
}
