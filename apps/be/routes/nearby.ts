import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { extractAndVerifyToken } from "../utils/auth";
import { logger } from "../lib/logger";

type NearbyRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  locationLat: number | null;
  locationLng: number | null;
  distance_m: number;
};

const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 100;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/users/nearby?radiusKm=5&limit=20&lat=..&lng=..
 * If lat/lng are not provided, uses the authenticated user's saved location.
 */
export async function handleGetNearbyUsers(req: Request): Promise<Response> {
  try {
    const userId = extractAndVerifyToken(req);
    if (!userId) return failure("Unauthorized", "Auth Error", 401);

    const url = new URL(req.url);

    const radiusKmRaw = url.searchParams.get("radiusKm");
    const limitRaw = url.searchParams.get("limit");
    const latRaw = url.searchParams.get("lat");
    const lngRaw = url.searchParams.get("lng");

    const radiusKm = radiusKmRaw ? Number(radiusKmRaw) : DEFAULT_RADIUS_KM;
    const limit = limitRaw ? Number(limitRaw) : DEFAULT_LIMIT;

    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > MAX_RADIUS_KM) {
      return failure("Invalid radiusKm", "Validation Error", 400);
    }

    if (!Number.isFinite(limit) || limit <= 0 || limit > MAX_LIMIT) {
      return failure("Invalid limit", "Validation Error", 400);
    }

    let latitude = latRaw !== null ? Number(latRaw) : undefined;
    let longitude = lngRaw !== null ? Number(lngRaw) : undefined;

    if (latitude === undefined || longitude === undefined) {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { locationLat: true, locationLng: true },
      });

      latitude = profile?.locationLat ?? undefined;
      longitude = profile?.locationLng ?? undefined;
    }

    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return failure("Location not set", "Validation Error", 400);
    }

    if (latitude < -90 || latitude > 90) {
      return failure("Latitude out of range", "Validation Error", 400);
    }

    if (longitude < -180 || longitude > 180) {
      return failure("Longitude out of range", "Validation Error", 400);
    }

    const radiusMeters = radiusKm * 1000;

    const rows = await prisma.$queryRaw<NearbyRow[]>`
      SELECT
        u.id,
        u.name,
        u.email,
        p."phone",
        p."locationLat",
        p."locationLng",
        ST_Distance(
          p."locationGeo",
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) AS distance_m
      FROM "User" u
      JOIN "Profile" p ON p."userId" = u.id
      WHERE u.id <> ${userId}
        AND p."locationGeo" IS NOT NULL
        AND ST_DWithin(
          p."locationGeo",
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_m ASC
      LIMIT ${limit}
    `;

    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      locationLat: row.locationLat,
      locationLng: row.locationLng,
      distanceKm: Math.round((row.distance_m / 1000) * 1000) / 1000,
    }));

    return success("Nearby users", data);
  } catch (err) {
    logger.error("Nearby Users Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
