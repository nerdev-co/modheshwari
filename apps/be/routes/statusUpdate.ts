import prisma from "@modheshwari/db";
import { requireAuth } from "./authMiddleware";
import { success, failure } from "@modheshwari/utils/response";
import type { Role } from "@prisma/client";

// ---------------- CREATE ----------------
/**
 * Creates a status update request for a target user.
 *
 * This endpoint implements a multi-level approval workflow: the request is
 * created with two pending approvals — one for a COMMUNITY_SUBHEAD and one
 * for a GOTRA_HEAD. The target user's profile is set to `status: false`
 * (deceased) only after both approvers have approved the request.
 *
 * The `finalStatus` is hardcoded to `"deceased"` because this endpoint is
 * specifically for recording a death status update; the approval workflow
 * ensures the change is reviewed before taking effect.
 *
 * @async
 * @function handleCreateStatusUpdateRequest
 * @route POST /api/status-updates
 * @param {Request} req - The incoming HTTP request. The request body must
 *   contain `targetUserId` (string, required) and an optional `reason` (string).
 * @returns {Promise<Response>} JSON response with the created request object
 *   on success, or an error message with HTTP status code on failure.
 *
 * @example
 * // Request body
 * POST /api/status-updates
 * {
 *   "targetUserId": "user-uuid-here",
 *   "reason": "Passed away on 2026-07-30"
 * }
 *
 * // Response (success)
 * {
 *   "message": "Request created",
 *   "data": { "request": { "id": "...", "finalStatus": "deceased", ... } }
 * }
 */
export async function handleCreateStatusUpdateRequest(req: Request) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = (auth.payload.userId ?? auth.payload.id) as string;

    const body = (await req.json()) as {
      targetUserId?: string;
      reason?: string;
    };

    const { targetUserId, reason } = body;
    if (!targetUserId) return failure("targetUserId is required", null, 400);

    // Create request
    const request = await prisma.statusUpdateRequest.create({
      data: {
        targetUserId,
        requestedById: userId,
        reason,
        finalStatus: "deceased",
        approvals: {
          create: [
            {
              approverId: await findApprover("COMMUNITY_SUBHEAD"),
              approverName: "Community Subhead",
              role: "COMMUNITY_SUBHEAD" as Role,
            },
            {
              approverId: await findApprover("GOTRA_HEAD"),
              approverName: "Gotra Head",
              role: "GOTRA_HEAD" as Role,
            },
          ],
        },
      },
    });

    return success("Request created", { request });
  } catch (err) {
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

// ---------------- Helper — find approver ----------------
/**
 * Finds an active user with the given role to serve as an approver.
 *
 * @async
 * @function findApprover
 * @param {Role} role - The Prisma Role enum value to search for
 *   (e.g., `"COMMUNITY_SUBHEAD"`, `"GOTRA_HEAD"`).
 * @returns {Promise<string>} The `id` of the first active user with
 *   the specified role.
 * @throws {Error} If no active user with the given role exists.
 */
async function findApprover(role: Role): Promise<string> {
  const approver = await prisma.user.findFirst({
    where: { role, status: true },
    select: { id: true },
  });
if (!approver) throw new Error(`No active approver found for role: ${role}`);
  return approver.id;
}

// ---------------- LIST ----------------
/**
 * Lists status update requests visible to the authenticated user.
 *
 * The user can see requests they created (`requestedById`) and requests
 * where they are listed as an approver. This supports the multi-level
 * approval workflow by allowing each approver to view the requests
 * assigned to them.
 *
 * @async
 * @function handleListStatusUpdateRequests
 * @route GET /api/status-updates
 * @param {Request} req - The incoming HTTP request.
 * @returns {Promise<Response>} JSON response with an array of status
 *   update requests including their approvals and target user details.
 */
export async function handleListStatusUpdateRequests(req: Request) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = auth.payload.userId as string;

    const requests = await prisma.statusUpdateRequest.findMany({
      where: {
        OR: [
          { requestedById: userId },
          { approvals: { some: { approverId: userId } } },
        ],
      },
      include: {
        targetUser: {
          select: { id: true, name: true, email: true, role: true, status: true },
        },
        approvals: {
          select: { id: true, status: true, approverName: true, role: true, reviewedAt: true, remarks: true },
        },
      },
    });

    return success("Fetched status update requests", { requests });
  } catch (err) {
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

// ---------------- REVIEW ----------------
/**
 * Reviews a status update request by recording the authenticated
 * user's approval or rejection.
 *
 * Implements the second stage of the multi-level approval workflow:
 * each request requires approvals from both a COMMUNITY_SUBHEAD and
 * a GOTRA_HEAD. When all approvers have approved, the request status
 * is set to `"APPROVED"` and the target user's profile is set to
 * `status: false` (deceased). A single rejection from any approver
 * blocks the request from being auto-approved; the request remains
 * in PENDING status and requires further review.
 *
 * @async
 * @function handleReviewStatusUpdateRequest
 * @route POST /api/status-updates/:id/review
 * @param {Request} req - The incoming HTTP request. The body must
 *   contain `status` (`"APPROVED"` or `"REJECTED"`) and an optional
 *   `remarks` string.
 * @param {string} id - The UUID of the status update request to review.
 * @returns {Promise<Response>} JSON response with the approval record
 *   on success, or an error message with HTTP status code on failure.
 *
 * @example
 * // Approve a status update request
 * POST /api/status-updates/:id/review
 * {
 *   "status": "APPROVED",
 *   "remarks": "Verified death certificate"
 * }
 *
 * // Response (success)
 * {
 *   "message": "Review submitted",
 *   "data": { "approval": { "id": "...", "status": "APPROVED", ... } }
 * }
 */
export async function handleReviewStatusUpdateRequest(
  req: Request,
  id: string,
) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = auth.payload.userId as string;

    const body = (await req.json()) as {
      status?: "APPROVED" | "REJECTED";
      remarks?: string;
    };

    const { status, remarks } = body;
    if (!status) return failure("Status field is required", null, 400);

    // Wrap approval + profile update in a transaction to prevent race condition
    // where two concurrent approvals both see "all approved" and both update the profile
    const result = await prisma.$transaction(async (tx) => {
      const updatedApproval = await tx.statusUpdateApproval.updateMany({
        where: {
          requestId: id,
          approverId: userId,
        },
        data: { status, remarks, reviewedAt: new Date() },
      });

      const allApproved = await tx.statusUpdateApproval.count({
        where: { requestId: id, status: "APPROVED" },
      });
      const totalApprovers = await tx.statusUpdateApproval.count({
        where: { requestId: id },
      });

      if (allApproved === totalApprovers) {
        await tx.statusUpdateRequest.update({
          where: { id },
          data: { status: "APPROVED", reviewedAt: new Date() },
        });

        const reqObj = await tx.statusUpdateRequest.findUnique({
          where: { id },
          select: { targetUserId: true },
        });
        if (reqObj?.targetUserId) {
          await tx.profile.updateMany({
            where: { userId: reqObj.targetUserId },
            data: { status: false },
          });
        }
      }

      return updatedApproval;
    });

    return success("Review submitted", { approval: result });
  } catch (err) {
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
