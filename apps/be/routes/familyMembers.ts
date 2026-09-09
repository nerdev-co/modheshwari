import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import {
  parsePagination,
  buildPaginationResponse,
} from "@modheshwari/utils/pagination";

import { requireAuth } from "./authMiddleware";
import { logger } from "../lib/logger";

/**
 * GET /api/family/members
 * Returns all (or only alive) members of the family the head belongs to
 * Add `?all=true` to include dead members.
 * Supports pagination with `?page=1&limit=50`
 */
export async function handleGetFamilyMembers(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = auth.payload.userId as string;

    // Find family headed by this user
    const family = await prisma.family.findFirst({
      where: { headId: userId },
    });
    if (!family) return failure("Family not found", "Not Found", 404);

    // Parse query params
    const url = new URL(req.url);
    const includeAll = url.searchParams.get("all") === "true";

    // Parse pagination
    const { skip, take, page, limit } = parsePagination(
      {
        page: url.searchParams.get("page"),
        limit: url.searchParams.get("limit"),
      },
      50,
      100,
    );

    // If not all, only fetch alive members
    const userFilter = includeAll ? {} : { status: true };

    // Get total count
    const total = await prisma.familyMember.count({
      where: { familyId: family.id, user: userFilter },
    });

    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id, user: userFilter },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            profile: {
              select: {
                phone: true,
                gotra: true,
                profession: true,
                location: true,
              },
            },
          },
        },
      },
      skip,
      take,
      orderBy: { joinedAt: "desc" },
    });

    // Filter out null users (dead ones when all=false)
    const filteredMembers = members.filter((m: any) => m.user !== null);

    return success(
      includeAll
        ? "All family members fetched"
        : "Alive family members fetched",
      {
        family,
        members: filteredMembers,
        pagination: buildPaginationResponse(
          filteredMembers,
          total,
          page,
          limit,
        ),
      },
    );
  } catch (err) {
    logger.error(" handleGetFamilyMembers error:", err);
    return failure("Internal Server Error", "Unexpected Error", 500);
  }
}
