import prisma from "@modheshwari/db";
import { requireAuth } from "./authMiddleware";
import { success, failure } from "@modheshwari/utils/response";

import { logger } from "../lib/logger";

/**
 * Handles transferring a user to a new family (e.g., due to marriage).
 * Adds the user as a member of the new family without ending existing memberships.
 *
 * @param {Request} req - The incoming HTTP request. Expects JSON body with `newFamilyId`.
 * @returns {Promise<Response>} - JSON response with status and membership details.
 */
export async function handleFamilyTransfer(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const userId = (auth.payload.userId ?? auth.payload.id) as string;

  const body = (await req.json()) as { newFamilyId?: string };
  const { newFamilyId } = body;
  if (!newFamilyId) return failure("newFamilyId is required", null, 400);

  try {
    // Verify the target family exists
    const targetFamily = await prisma.family.findUnique({
      where: { id: newFamilyId },
      select: { id: true },
    });
    if (!targetFamily) return failure("Family not found", "Not Found", 404);
    
    // Create membership in the new family
    const membership = await prisma.familyMember.create({
      data: {
        userId,
        familyId: newFamilyId,
        role: "MEMBER",
        joinedAt: new Date(),
      },
    });

    return success("Family transfer completed", { membership });
  } catch (err) {
    logger.error("Family transfer failed:", err);
    return failure("Internal server error", null, 500);
  }
}
