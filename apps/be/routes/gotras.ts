import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "./authMiddleware";
import { logger } from "../lib/logger";

/**
 * GET /api/gotras
 * Returns all gotras with member counts.
 * Any authenticated user can view this list.
 */
export async function handleListGotras(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    // Get all profiles that have a gotra set, grouped by gotra
    const profiles = await prisma.profile.findMany({
      where: { gotra: { not: null } },
      select: { gotra: true, userId: true },
    });

    // Group by gotra and count members
    const gotraMap = new Map<string, number>();
    for (const p of profiles) {
      if (p.gotra) {
        gotraMap.set(p.gotra, (gotraMap.get(p.gotra) || 0) + 1);
      }
    }

    // Get gotra heads for each gotra
    const gotraHeads = await prisma.user.findMany({
      where: { role: "GOTRA_HEAD" },
      select: {
        id: true,
        name: true,
        profile: { select: { gotra: true } },
      },
    });

    const headMap = new Map<string, { id: string; name: string }>();
    for (const h of gotraHeads) {
      if (h.profile?.gotra) {
        headMap.set(h.profile.gotra, { id: h.id, name: h.name });
      }
    }

    const gotras = Array.from(gotraMap.entries()).map(([name, memberCount]) => ({
      name,
      memberCount,
      head: headMap.get(name) || null,
    }));

    // Sort alphabetically
    gotras.sort((a, b) => a.name.localeCompare(b.name));

    return success("Gotras fetched", { gotras }, 200);
  } catch (err) {
    logger.error("List Gotras Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/gotras/:gotraName/families
 * Returns all families that have members belonging to the specified gotra.
 * Any authenticated user can view this.
 */
export async function handleGetGotraFamilies(
  req: Request,
  gotraName: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    // Decode the gotra name from URL encoding
    const decodedGotra = decodeURIComponent(gotraName);

    // Find all users with this gotra
    const usersWithGotra = await prisma.profile.findMany({
      where: { gotra: decodedGotra },
      select: { userId: true },
    });

    if (usersWithGotra.length === 0) {
      return success("No members found for this gotra", { families: [] }, 200);
    }

    const userIds = usersWithGotra.map((p) => p.userId);

    // Find all families these users belong to
    const familyMembers = await prisma.familyMember.findMany({
      where: { userId: { in: userIds } },
      select: {
        familyId: true,
        userId: true,
        role: true,
        family: {
          select: {
            id: true,
            name: true,
            uniqueId: true,
            headId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Group by family
    const familyMap = new Map<
      string,
      {
        id: string;
        name: string;
        uniqueId: string;
        headId: string | null;
        members: Array<{ userId: string; name: string; email: string; role: string }>;
      }
    >();

    for (const fm of familyMembers) {
      const existing = familyMap.get(fm.familyId);
      if (existing) {
        existing.members.push({
          userId: fm.userId,
          name: fm.user.name,
          email: fm.user.email,
          role: fm.role,
        });
      } else {
        familyMap.set(fm.familyId, {
          id: fm.family.id,
          name: fm.family.name,
          uniqueId: fm.family.uniqueId,
          headId: fm.family.headId,
          members: [
            {
              userId: fm.userId,
              name: fm.user.name,
              email: fm.user.email,
              role: fm.role,
            },
          ],
        });
      }
    }

    const families = Array.from(familyMap.values());

    return success("Gotra families fetched", { gotra: decodedGotra, families }, 200);
  } catch (err) {
    logger.error("Get Gotra Families Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
