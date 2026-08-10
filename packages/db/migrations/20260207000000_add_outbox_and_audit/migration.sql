CREATE TABLE "OutboxEvent" (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    eventType TEXT NOT NULL,
    aggregateType TEXT NOT NULL,
    aggregateId TEXT NOT NULL,
    payload JSONB NOT NULL,
    topic TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    lastError TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY (id)
);

CREATE INDEX "OutboxEvent_publishedAt_createdAt_idx" ON "OutboxEvent"("publishedAt", "createdAt");
CREATE INDEX "OutboxEvent_topic_idx" ON "OutboxEvent"(topic);

CREATE TABLE "RoleChangeAudit" (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "previousRole" TEXT NOT NULL,
    "newRole" TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT 'ROLE_CHANGE',
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    reason TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoleChangeAudit_pkey" PRIMARY KEY (id)
);

CREATE INDEX "RoleChangeAudit_actorId_createdAt_idx" ON "RoleChangeAudit"("actorId", "createdAt");
CREATE INDEX "RoleChangeAudit_targetId_createdAt_idx" ON "RoleChangeAudit"("targetId", "createdAt");
CREATE INDEX "RoleChangeAudit_createdAt_idx" ON "RoleChangeAudit"("createdAt");
