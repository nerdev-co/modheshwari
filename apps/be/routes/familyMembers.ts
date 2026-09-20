import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import {
  parsePagination,
  buildPaginationResponse,
} from "@modheshwari/utils/pagination";

import { requireAuth } from "./authMiddleware";
import { canGotraHeadManageFamily } from "../lib/gotraAuth";
import { logger } from "../lib/logger";

/**
 * GET /api/family/members
 * Returns all (or only alive) members of the family the head belongs to.
 * GOTRA_HEAD can pass ?familyId=xxx to view any family within their gotra.
 * Add `?all=true` to include dead members.
 * Supports pagination with `?page=1&limit=50`
 */
export async function handleGetFamilyMembers(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = auth.payload.userId as string;

    const url = new URL(req.url);
    const requestedFamilyId = url.searchParams.get("familyId");

    let familyId: string;

    if (requestedFamilyId && auth.payload.role === "GOTRA_HEAD") {
      // GOTRA_HEAD requesting a specific family — verify gotra match
      const gotraAuth = await canGotraHeadManageFamily(userId, requestedFamilyId);
      if (!gotraAuth.ok) {
        return failure("You can only view families in your gotra", "Forbidden", 403);
      }
      familyId = requestedFamilyId;
    } else {
      // Default: find family headed by this user
      const family = await prisma.family.findFirst({
        where: { headId: userId },
      });
      if (!family) return failure("Family not found", "Not Found", 404);
      familyId = family.id;
    }

    // Parse query params
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
      where: { familyId, user: userFilter },
    });

    const members = await prisma.familyMember.findMany({
      where: { familyId, user: userFilter },
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
