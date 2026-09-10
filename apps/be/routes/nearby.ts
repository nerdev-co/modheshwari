import { z } from "zod";
import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { validateQuery } from "../lib/validate";
import { requireAuth } from "./authMiddleware";
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

const NearbyQuerySchema = z.object({
  radiusKm: z.preprocess((val) => (val === undefined ? 5 : Number(val)), z.number().positive().max(100)),
  limit: z.preprocess((val) => (val === undefined ? 20 : Number(val)), z.number().positive().max(100)),
  lat: z.preprocess((val) => (val === undefined ? undefined : Number(val)), z.number().optional()),
  lng: z.preprocess((val) => (val === undefined ? undefined : Number(val)), z.number().optional()),
});

/**
 * GET /api/users/nearby?radiusKm=5&limit=20&lat=..&lng=..
 * If lat/lng are not provided, uses the authenticated user's saved location.
 */
export async function handleGetNearbyUsers(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = auth.payload.userId as string;

    const queryValidation = validateQuery(req, NearbyQuerySchema);
    if (!queryValidation.ok) return queryValidation.response;
    const { radiusKm, limit, lat, lng } = queryValidation.data;

    let latitude = lat !== undefined ? lat : undefined;
    let longitude = lng !== undefined ? lng : undefined;

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
