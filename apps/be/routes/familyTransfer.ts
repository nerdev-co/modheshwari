import { z } from "zod";
import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "./authMiddleware";
import { validateBody } from "../lib/validate";
import { logger } from "../lib/logger";

const FamilyTransferRequestSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  newFamilyId: z.string().min(1, "newFamilyId is required"),
});

const FamilyTransferReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

/**
 * POST /api/family/transfer
 * Family Head requests transfer of a member to another family.
 * Only FAMILY_HEAD of the member's current family or ADMIN can initiate.
 * Admin must approve before the transfer is completed.
 */
export async function handleFamilyTransferRequest(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const requesterId = (auth.payload.userId ?? auth.payload.id) as string;
  const requesterRole = auth.payload.role as string;

  const v = await validateBody(req, FamilyTransferRequestSchema);
  if (!v.ok) return v.response;
  const { userId, newFamilyId } = v.data;

  try {
    const targetFamily = await prisma.family.findUnique({
      where: { id: newFamilyId },
      select: { id: true, name: true },
    });
    if (!targetFamily) return failure("Target family not found", "Not Found", 404);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });
    if (!targetUser) return failure("User not found", "Not Found", 404);
    if (targetUser.role !== "MEMBER") {
      return failure("Only members can be transferred", "Forbidden", 403);
    }

    const currentMembership = await prisma.familyMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "desc" },
      select: { familyId: true, family: { select: { headId: true, name: true } } },
    });

    if (!currentMembership) {
      return failure("User is not a member of any family", "Bad Request", 400);
    }

    const isFamilyHead = currentMembership.family.headId === requesterId;

    if (!isFamilyHead && requesterRole !== "COMMUNITY_HEAD" && requesterRole !== "COMMUNITY_SUBHEAD" && requesterRole !== "GOTRA_HEAD") {
      return failure(
        "Only the family head or an admin can request a transfer",
        "Forbidden",
        403,
      );
    }

    if (currentMembership.familyId === newFamilyId) {
      return failure("User is already in this family", "Bad Request", 400);
    }

    const admins = await prisma.user.findMany({
      where: { role: { in: ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD"] } },
      select: { id: true },
    });

    if (admins.length === 0) {
      return failure("No admins available to review transfer", "Server Error", 500);
    }

    const requesterName = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { name: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "family_transfer_request" as any,
          message: `Transfer request: Move ${targetUser.name} from ${currentMembership.family.name} to ${targetFamily.name}. Requested by ${requesterName?.name ?? "Unknown"}.`,
          metadata: JSON.stringify({
            type: "family_transfer_request",
            targetUserId: userId,
            fromFamilyId: currentMembership.familyId,
            toFamilyId: newFamilyId,
            requesterId,
          }),
        },
      });
    }

    return success("Transfer request submitted — pending admin approval", {
      targetUser: { id: targetUser.id, name: targetUser.name },
      fromFamily: { id: currentMembership.familyId, name: currentMembership.family.name },
      toFamily: { id: targetFamily.id, name: targetFamily.name },
    });
  } catch (err) {
    logger.error("Family transfer request failed:", err);
    return failure("Internal server error", null, 500);
  }
}

/**
 * POST /api/family/transfer/:notificationId/review
 * Admin approves or rejects a family transfer request.
 */
export async function handleFamilyTransferReview(
  req: Request,
  notificationId: string,
  action: string,
) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const adminId = (auth.payload.userId ?? auth.payload.id) as string;
  const adminRole = auth.payload.role as string;

  if (adminRole !== "COMMUNITY_HEAD" && adminRole !== "COMMUNITY_SUBHEAD") {
    return failure("Only community head or subhead can review transfer requests", "Forbidden", 403);
  }

  if (action !== "approve" && action !== "reject") {
    return failure("Action must be 'approve' or 'reject'", "Bad Request", 400);
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, type: true, metadata: true, userId: true },
    });

    if (!notification) {
      return failure("Transfer request not found", "Not Found", 404);
    }

    if (notification.userId !== adminId) {
      return failure("This request was not assigned to you", "Forbidden", 403);
    }

    const metadata = notification.metadata ? JSON.parse(notification.metadata as string) : null;
    if (!metadata || metadata.type !== "family_transfer_request") {
      return failure("Invalid transfer request", "Bad Request", 400);
    }

    const { targetUserId, fromFamilyId, toFamilyId } = metadata;

    if (action === "reject") {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { metadata: JSON.stringify({ ...metadata, status: "rejected", reviewedBy: adminId }) },
      });
      return success("Transfer request rejected", { status: "rejected" });
    }

    await prisma.$transaction(async (tx) => {
      const existingMembership = await tx.familyMember.findFirst({
        where: { userId: targetUserId, familyId: fromFamilyId },
      });

      if (existingMembership) {
        await tx.familyMember.delete({
          where: { id: existingMembership.id },
        });
      }

      await tx.familyMember.create({
        data: {
          userId: targetUserId,
          familyId: toFamilyId,
          role: "MEMBER",
          joinedAt: new Date(),
        },
      });

      await tx.notification.update({
        where: { id: notificationId },
        data: { metadata: JSON.stringify({ ...metadata, status: "approved", reviewedBy: adminId }) },
      });
    });

    return success("Transfer completed successfully", { status: "approved" });
  } catch (err) {
    logger.error("Family transfer review failed:", err);
    return failure("Internal server error", null, 500);
  }
}
