import { z } from "zod";
import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "./authMiddleware";
import { validateBody } from "../lib/validate";
import { logger } from "../lib/logger";

const FamilyTransferSchema = z.object({
  newFamilyId: z.string().min(1, "newFamilyId is required"),
});

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

  const v = await validateBody(req, FamilyTransferSchema);
  if (!v.ok) return v.response;
  const body = v.data;
  const { newFamilyId } = body;

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
