import type { Role } from "@prisma/client";
import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "../authMiddleware";
import { ADMIN_ROLES, VALID_ROLES } from "./constants";
import { checkRoleChangePermission } from "./permissions";
import { createOutboxEvent } from "../../lib/outbox";
import { TOPICS } from "../../kafka/config";
import { logger } from "../../lib/logger";
import { errorCounter } from "../../lib/metrics";

const ROLE_CHANGE_RATE_LIMIT = Number(process.env.ROLE_CHANGE_RATE_LIMIT || 5);
const ROLE_CHANGE_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * PATCH /api/admin/users/:id/role
 * Changes the role of a user (admin power transfer)
 * 
 * Body: { newRole: Role, approvalIds?: string[] }
 */
export async function handleChangeUserRole(
  req: Request,
  targetUserId: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

    const requesterId = auth.payload.userId || auth.payload.id;
    const requesterRole = auth.payload.role as Role;

    // Parse request body
    const body: any = await (req as Request).json().catch(() => null);
    if (!body || !body.newRole) {
      return failure("Missing newRole in request body", "Validation Error", 400);
    }

    const { newRole, approvalIds } = body;

    // Validate newRole
    if (!VALID_ROLES.includes(newRole)) {
      return failure("Invalid role specified", "Validation Error", 400);
    }

    // Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, role: true, email: true },
    });

    if (!targetUser) {
      return failure("User not found", "Not Found", 404);
    }

    // Cannot change your own role
    if (targetUserId === requesterId) {
      return failure(
        "Cannot change your own role",
        "Forbidden",
        403,
      );
    }

    // Check permissions based on requester role
    const canChange = await checkRoleChangePermission(
      requesterRole,
      targetUser.role,
      newRole,
      requesterId,
      approvalIds,
    );

    if (!canChange.allowed) {
      return failure(canChange.reason || "Forbidden", "Forbidden", 403);
    }

    // Anomaly detection: check for suspicious role change patterns
    const recentChanges = await prisma.roleChangeAudit.findMany({
      where: {
        actorId: requesterId,
        createdAt: {
          gte: new Date(Date.now() - ROLE_CHANGE_RATE_WINDOW_MS),
        },
      },
      select: { id: true, previousRole: true, newRole: true },
    });

    if (recentChanges.length >= ROLE_CHANGE_RATE_LIMIT) {
      logger.warn("Role change rate limit exceeded", {
        actorId: requesterId,
        actorRole: requesterRole,
        recentCount: recentChanges.length,
        windowMs: ROLE_CHANGE_RATE_WINDOW_MS,
      });
      errorCounter.inc({ type: "role_change_rate_limit" }, 1);
    }

    const demotionCount = recentChanges.filter(
      (c) => c.newRole !== c.previousRole && getRoleLevel(c.newRole) < getRoleLevel(c.previousRole)
    ).length;

    if (demotionCount >= 3) {
      logger.warn("Mass demotion detected", {
        actorId: requesterId,
        actorRole: requesterRole,
        demotionCount,
        windowMs: ROLE_CHANGE_RATE_WINDOW_MS,
      });
      errorCounter.inc({ type: "role_change_mass_demotion" }, 1);
    }

    // Update the user's role
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        },
      });

      await tx.roleChangeAudit.create({
        data: {
          actorId: requesterId,
          actorRole: requesterRole,
          targetId: targetUserId,
          targetRole: newRole,
          previousRole: targetUser.role,
          newRole,
          status: "SUCCESS",
        },
      });

      await createOutboxEvent(tx, {
        eventType: "role.changed",
        aggregateType: "User",
        aggregateId: targetUserId,
        payload: {
          actorId: requesterId,
          actorRole: requesterRole,
          targetId: targetUserId,
          previousRole: targetUser.role,
          newRole,
          timestamp: new Date().toISOString(),
        },
        topic: TOPICS.NOTIFICATION_EVENTS,
      });

      return updated;
    });

    // Create notification for the target user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "GENERIC",
        message: `Your role has been changed from ${targetUser.role} to ${newRole}`,
      },
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: requesterId,
        type: "GENERIC",
        message: `Successfully changed ${targetUser.name}'s role from ${targetUser.role} to ${newRole}`,
      },
    });

    return success("User role updated successfully", { user: updatedUser }, 200);
  } catch {
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    COMMUNITY_HEAD: 5,
    COMMUNITY_SUBHEAD: 4,
    GOTRA_HEAD: 3,
    FAMILY_HEAD: 2,
    MEMBER: 1,
  };
  return levels[role] ?? 0;
}
