import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import type { bloodGroup as PrismaBloodGroup } from "@prisma/client";
import { validatePhone, formatE164 } from "@modheshwari/utils/phone";

import { extractAndVerifyToken } from "../utils/auth";
import {
  isValidBloodGroup,
  normalizeBloodGroup,
} from "../utils/searchParser";
import { logger } from "../lib/logger";
import getRedisClient from "@modheshwari/redis";

const PROFILE_TTL = Number(process.env.PROFILE_TTL_SECONDS || 300);

/**
 * Performs profile cache key operation.
 * @param {string} userId - Description of userId
 * @returns {string} Description of return value
 */
function profileCacheKey(userId: string): string {
  return `user:profile:${userId}`;
}

/**
 * Performs fetch user with families operation.
 * @param {string} userId - Description of userId
 * @returns {import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").Prisma.Prisma__UserClient<{ name: string; id: string; email: string; role: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.Role; status: boolean; profile: { allergies: string; phone: string; address: string; profession: string; gotra: string; location: string; medicalNotes: string; locationLat: number; locationLng: number; bloodGroup: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.bloodGroup; }; families: { id: string; role: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.Role; family: { name: string; id: string; uniqueId: string; }; familyId: string; joinedAt: Date; }[]; }, null, import("/Users/nalindalal/modheshwari/node_modules/@prisma/client/runtime/library").DefaultArgs, import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").Prisma.PrismaClientOptions>} Description of return value
 */
function fetchUserWithFamilies(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,

      profile: {
        select: {
          phone: true,
          address: true,
          profession: true,
          gotra: true,
          location: true,
          locationLat: true,
          locationLng: true,
          bloodGroup: true,
          allergies: true,
          medicalNotes: true,
        },
      },

      families: {
        select: {
          id: true,
          familyId: true,
          joinedAt: true,
          family: {
            select: {
              id: true,
              name: true,
              uniqueId: true,
            },
          },
          role: true,
        },
      },
    },
  });
}

type MeUser = NonNullable<Awaited<ReturnType<typeof fetchUserWithFamilies>>>;

/**
 * GET /api/me
 * Returns the authenticated user's details and the families they belong to.
 */
export async function handleGetMe(req: Request): Promise<Response> {
  try {
    // --- Step 1: Extract and validate JWT ---
    const userId = extractAndVerifyToken(req);
    if (!userId) return failure("Unauthorized", "Auth Error", 401);

    // --- Step 2: Fetch user + family memberships ---
    const redis = await getRedisClient();
    const cacheKey = profileCacheKey(userId);
    const cached = await redis.get(cacheKey);

    let user: MeUser | null;

    if (cached) {
      // Dates come back as ISO strings after the JSON round-trip; the response
      // is re-serialized below, so the wire shape is identical either way.
      user = JSON.parse(cached) as MeUser;
    } else {
      user = await fetchUserWithFamilies(userId);

      if (user) {
        await redis.set(cacheKey, JSON.stringify(user), {
          EX: PROFILE_TTL,
        });
      }
    }

    if (!user) return failure("User not found", "Not Found", 404);

    // --- Step 3: Transform output ---
    const formatted = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
      families: user.families.map((fm: any) => ({
        id: fm.id,
        familyId: fm.familyId,
        role: fm.role,
        joinedAt: fm.joinedAt,
        family: {
          id: fm.family.id,
          name: fm.family.name,
          uniqueId: fm.family.uniqueId,
        },
      })),
    };

    logger.info(`/me fetched for userId=${user.id}`);

    // --- Step 4: Send success response ---
    return success("Fetched profile", formatted);
  } catch (err) {
    logger.error("GetMe Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * PUT /api/me
 * Updates the authenticated user's profile details.
 */
type UpdateProfileBody = {
  bloodGroup?: string;
  gotra?: string;
  profession?: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  phone?: string;
  phoneCountry?: string; // optional ISO2 country hint for parsing
};

/**
 * Updates the authenticated user's profile details.
 *
 * Validates and normalizes blood group, phone number, and
 * geographic coordinates. Partial updates are supported —
 * only the provided fields are modified.
 *
 * @async
 * @function handleUpdateMe
 * @route PUT /api/me
 * @param {Request} req - The incoming HTTP request. The body
 *   may contain any subset of: `bloodGroup`, `gotra`,
 *   `profession`, `location`, `locationLat`, `locationLng`,
 *   `phone`, and `phoneCountry`.
 * @returns {Promise<Response>} JSON response with the updated
 *   profile on success, or an error message with HTTP status
 *   code on failure.
 *
 * @example
 * // Update profile with blood group and phone
 * PUT /api/me
 * {
 *   "bloodGroup": "O+",
 *   "phone": "+1234567890",
 *   "phoneCountry": "US"
 * }
 *
 * // Response (success)
 * {
 *   "message": "Profile updated successfully",
 *   "data": { "phone": "+1234567890", "bloodGroup": "O_POS", ... }
 * }
 */
export async function handleUpdateMe(req: Request): Promise<Response> {
  try {
    // --- Step 1: Extract and validate JWT ---
    const userId = extractAndVerifyToken(req);
    if (!userId) return failure("Unauthorized", "Auth Error", 401);

    // --- Step 2: Parse and validate input ---
    const body = (await req.json()) as UpdateProfileBody;
    const {
      bloodGroup,
      gotra,
      profession,
      location,
      locationLat,
      locationLng,
    } = body;

    if (
      !bloodGroup &&
      !gotra &&
      !profession &&
      location === undefined &&
      locationLat === undefined &&
      locationLng === undefined &&
      body.phone === undefined
    ) {
      return failure(
        "No valid fields provided for update",
        "Validation Error",
        400,
      );
    }

    const hasLatLng = locationLat !== undefined || locationLng !== undefined;
    if (hasLatLng) {
      if (
        typeof locationLat !== "number" ||
        typeof locationLng !== "number" ||
        !Number.isFinite(locationLat) ||
        !Number.isFinite(locationLng)
      ) {
        return failure("Invalid latitude/longitude", "Validation Error", 400);
      }

      if (locationLat < -90 || locationLat > 90) {
        return failure("Latitude out of range", "Validation Error", 400);
      }

      if (locationLng < -180 || locationLng > 180) {
        return failure("Longitude out of range", "Validation Error", 400);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (bloodGroup !== undefined) {
      if (!isValidBloodGroup(bloodGroup)) {
        return failure(
          "Invalid blood group. Use format like O+, A-, AB+, etc.",
          "Validation Error",
          400,
        );
      }
      updateData.bloodGroup = normalizeBloodGroup(
        bloodGroup,
      ) as PrismaBloodGroup;
    }
    if (gotra !== undefined) updateData.gotra = gotra;
    if (profession !== undefined) updateData.profession = profession;

    if (location !== undefined) updateData.location = location;
    if (locationLat !== undefined) updateData.locationLat = locationLat;
    if (locationLng !== undefined) updateData.locationLng = locationLng;

    // Phone validation & normalization
    if (body.phone !== undefined) {
      const phoneRaw = String(body.phone || "").trim();
      if (phoneRaw.length === 0) {
        // allow clearing phone
        updateData.phone = null;
      } else {
        const countryHint = body.phoneCountry || undefined;
        const v = validatePhone(phoneRaw, countryHint);
        if (!v.valid) {
          return failure("Invalid phone number", "Validation Error", 400);
        }
        updateData.phone = v.e164 ?? formatE164(phoneRaw, countryHint);
      }
    }

    // --- Step 3: Update profile ---
    // Note: locationGeo is auto-updated via DB trigger when locationLat/locationLng change
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        status: true,
        bloodGroup: ((
          bloodGroup !== undefined && isValidBloodGroup(bloodGroup)
            ? normalizeBloodGroup(bloodGroup)
            : "O_POS"
        ) as PrismaBloodGroup),
        ...updateData,
      },
      select: {
        phone: true,
        address: true,
        profession: true,
        gotra: true,
        location: true,
        locationLat: true,
        locationLng: true,
        status: true,
        bloodGroup: true,
      },
    });

    // Invalidate profile cache
    try {
      const redis = await getRedisClient();
      await redis.del(profileCacheKey(userId));
    } catch {
      // Cache invalidation failure is non-critical
    }

    // --- Step 4: Send success response ---
    return success("Profile updated successfully", updatedProfile);
  } catch (err) {
    logger.error("UpdateMe Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
