CREATE TABLE "OutboxEventDeadLetter" (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    eventType TEXT NOT NULL,
    aggregateType TEXT NOT NULL,
    aggregateId TEXT NOT NULL,
    payload JSONB NOT NULL,
    topic TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    lastError TEXT,
    publishedAt TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadLetteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    CONSTRAINT "OutboxEventDeadLetter_pkey" PRIMARY KEY (id)
);

CREATE INDEX "OutboxEventDeadLetter_topic_createdAt_idx" ON "OutboxEventDeadLetter"("topic", "createdAt");
CREATE INDEX "OutboxEventDeadLetter_createdAt_idx" ON "OutboxEventDeadLetter"("createdAt");
