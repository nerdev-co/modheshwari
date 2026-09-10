import { randomUUID } from "crypto";

import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { hashPassword } from "@modheshwari/utils/hash";
import { z } from "zod";

import { requireAuth } from "./authMiddleware";
import { logger } from "../lib/logger";
import { validateBody } from "../lib/validate";

const CreateFamilySchema = z.object({
  name: z.string().min(1, "Family name is required"),
  uniqueId: z.string().optional(),
});

/**
 * Create a Family for the authenticated user and make them the head.
 * POST /api/families
 * Body: { name: string, uniqueId?: string }
 */
export async function handleCreateFamily(req: any): Promise<Response> {
  try {
    // Require authentication (any role)
    const authCheck = requireAuth(req as Request);
    if (!authCheck.ok) return authCheck.response as Response;
    const userId = authCheck.payload.userId ?? authCheck.payload.id;

    const v = await validateBody(req, CreateFamilySchema);
    if (!v.ok) return v.response;
    const body = v.data;
    const { name, uniqueId } = body;

    const family = await prisma.family.create({
      data: {
        name,
        uniqueId: uniqueId
          ? uniqueId
          : `FAM-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
        headId: userId,
      },
    });

    // Link the creating user as FAMILY_HEAD member
    await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId,
        role: "FAMILY_HEAD",
      },
    });

    return success("Family created", { family }, 201);
  } catch (err) {
    logger.error("Create Family Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Add an existing user to a family (must be family head).
 * POST /api/families/:id/members
 * Body: { userId?: string, email?: string, role?: string }
 */
const AddMemberSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  role: z.string().optional(),
}).refine((data) => data.userId || data.email, {
  message: "Provide userId or email to add",
  path: ["userId"],
});

export async function handleAddMember(
  req: any,
  familyId: string,
): Promise<Response> {
  try {
    const authCheck = requireAuth(req as Request);
    if (!authCheck.ok) return authCheck.response as Response;
    const requesterId = authCheck.payload.userId ?? authCheck.payload.id;

    // Verify requester is head of the family
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return failure("Family not found", "Not Found", 404);
    if (family.headId !== requesterId)
      return failure("Only family head can add members", "Forbidden", 403);

    const v = await validateBody(req as Request, AddMemberSchema);
    if (!v.ok) return v.response;
    const body = v.data;
    const { userId, email, role } = body;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      // email is not unique at the schema level; use findFirst to avoid
      // Prisma validation errors. Consider adding @unique to User.email.
      user = await prisma.user.findFirst({ where: { email } });
    }

    if (!user) return failure("User not found", "Not Found", 404);

    // Prevent duplicate membership with same role
    const existing = await prisma.familyMember.findFirst({
      where: { familyId: family.id, userId: user.id, role: (role ?? "MEMBER") as any },
    });
    if (existing)
      return failure("User already member with that role", "Conflict", 409);

    const fm = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId: user.id,
        role: (role ?? "MEMBER") as any,
      },
    });

    return success("Member added", { member: fm }, 201);
  } catch (err) {
    logger.error("Add Member Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

// List pending invites for a family (family-head only)
/**
 * Lists pending member invites for a family.
 *
 * Only the family head can view pending invites.
 *
 * @async
 * @function handleListInvites
 * @route GET /api/families/:familyId/invites
 * @param {any} req - The incoming HTTP request.
 * @param {string} familyId - The UUID of the family whose
 *   pending invites are to be listed.
 * @returns {Promise<Response>} JSON response with an array of
 *   pending invites including the invited user's details on
 *   success, or an error message with HTTP status code on failure.
 */
export async function handleListInvites(
  req: any,
  familyId: string,
): Promise<Response> {
  try {
    const authCheck = requireAuth(req as Request);
    if (!authCheck.ok) return authCheck.response as Response;
    const requesterId = authCheck.payload.userId ?? authCheck.payload.id;
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return failure("Family not found", "Not Found", 404);
    if (family.headId !== requesterId)
      return failure("Only family head can view invites", "Forbidden", 403);

    const invites = await prisma.memberInvite.findMany({
      where: { familyId, status: "PENDING" },
      include: {
        invitedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return success("Invites fetched", { invites }, 200);
  } catch (err) {
    logger.error("List Invites Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

// Review (approve/reject) an invite
/**
 * Approves or rejects a pending member invite for a family.
 *
 * When approving an invite that was created for an email
 * address (no existing user), a placeholder user account is
 * created with a randomly generated password (a UUID-derived
 * 16-character string). The password is hashed before storage.
 * The invited user must set their own password on first login.
 *
 * Only the family head can review invites.
 *
 * @async
 * @function handleReviewInvite
 * @route POST /api/families/:familyId/invites/:inviteId
 * @param {any} req - The incoming HTTP request. The body must
 *   contain `action` (`"approve"` or `"reject"`) and an
 *   optional `remarks` string.
 * @param {string} familyId - The UUID of the family the
 *   invite belongs to.
 * @param {string} inviteId - The UUID of the invite to review.
 * @param {string} _action - Unused route parameter; the
 *   action is read from the request body instead.
 * @returns {Promise<Response>} JSON response confirming the
 *   invite was approved or rejected, or an error message with
 *   HTTP status code on failure.
 *
 * @example
 * // Approve an invite
 * POST /api/families/:familyId/invites/:inviteId
 * {
 *   "action": "approve"
 * }
 *
 * // Response (success)
 * {
 *   "message": "Invite approved and member added",
 *   "data": null
 * }
 */
const ReviewInviteSchema = z.object({
  action: z.enum(["approve", "reject"]),
  remarks: z.string().optional(),
});

export async function handleReviewInvite(
  req: any,
  familyId: string,
  inviteId: string,
  _action: string,
): Promise<Response> {
  try {
    const authCheck = requireAuth(req as Request, ["FAMILY_HEAD"]);
    if (!authCheck.ok) return authCheck.response as Response;
    const reviewerId = authCheck.payload.userId ?? authCheck.payload.id;
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return failure("Family not found", "Not Found", 404);
    if (family.headId !== reviewerId)
      return failure("Only family head can review invites", "Forbidden", 403);

    const invite = await prisma.memberInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) return failure("Invite not found", "Not Found", 404);
    if (invite.status !== "PENDING")
      return failure("Invite already reviewed", "Conflict", 409);

    const v = await validateBody(req as Request, ReviewInviteSchema);
    if (!v.ok) return v.response;
    const body = v.data;
    const { action } = body;
    const remarks = body.remarks ?? null;

    if (action === "approve") {
      // Ensure there's at least an email or invited user
      if (!invite.invitedUserId && !invite.inviteEmail) {
        return failure(
          "Cannot approve invite without an associated user or email",
          "Invalid Invite",
          400,
        );
      }

      // Use a transaction to ensure atomicity: create user (if needed) + familyMember + update invite + notify
      await prisma.$transaction(async (tx: any) => {
        let invitedUserId = invite.invitedUserId;

        // If invite was created for an email (no user exists yet), create a placeholder user
        // with a randomly generated password. The password is a UUID-derived 16-character
        // string, hashed before storage. The user must set their own password on first login.
        if (!invitedUserId && invite.inviteEmail) {
          const pw = randomUUID().replace(/-/g, "").slice(0, 16);
          const hashed = await hashPassword(pw);
          const newUser = await tx.user.create({
            data: {
              name: (invite.inviteEmail as string).split("@")[0],
              email: invite.inviteEmail as string,
              password: hashed,
              role: "MEMBER",
              status: true,
            },
          });
          invitedUserId = newUser.id;

          // persist invitedUserId onto invite
          await tx.memberInvite.update({
            where: { id: inviteId },
            data: { invitedUserId },
          });
        }

        // create FamilyMember
        await tx.familyMember.create({
          data: {
            familyId: family.id,
            userId: invitedUserId!,
            role: "MEMBER",
          },
        });

        // update invite
        await tx.memberInvite.update({
          where: { id: inviteId },
          data: {
            status: "APPROVED",
            reviewedById: reviewerId,
            reviewedAt: new Date(),
            remarks,
          },
        });

        // create notification for invited user
        await tx.notification.create({
          data: {
            userId: invitedUserId!,
            type: "invite_approved" as any,
            message: `Your request to join ${family.name} has been approved.`,
          },
        });
      });

      return success("Invite approved and member added", null, 200);
    }

    if (action === "reject") {
      await prisma.memberInvite.update({
        where: { id: inviteId },
        data: {
          status: "REJECTED",
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          remarks,
        },
      });

      if (invite.invitedUserId) {
        await prisma.notification.create({
          data: {
            userId: invite.invitedUserId,
            type: "invite_rejected" as any,
            message: `Your request to join ${family.name} has been rejected.`,
          },
        });
      }

      return success("Invite rejected", null, 200);
    }

    return failure("Invalid action", "Bad Request", 400);
  } catch (err) {
    logger.error("Review Invite Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
