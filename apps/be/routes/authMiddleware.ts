/**
 * @file apps/be/routes/authMiddleware.ts
 * @description Authentication helpers for validating JWT tokens on protected routes.
 */

import { verifyJWT } from "@modheshwari/utils/jwt";

import { logger } from "../lib/logger";

/**
 * Helper: extract and verify JWT from Request's Authorization header.
 * Returns decoded payload or null if invalid/missing.
 */
export function getAuthPayload(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return null;
    const decoded = verifyJWT(token);
    return decoded as any;
  } catch (err) {
    logger.error("Get Auth Payload Error:", err);
    return null;
  }
}

/**
 * Helper: require authentication and optionally restrict to allowed roles.
 * Returns an object { ok: true, payload } or { ok: false, response } where
 * response is a prebuilt JSON Response to return from the handler.
 */
export function requireAuth(req: Request, allowedRoles?: string[]) {
  const payload: any = getAuthPayload(req);
  if (!payload) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          status: "error",
          message: "Unauthorized",
          data: null,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!allowedRoles.includes(payload.role)) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ status: "error", message: "Forbidden", data: null }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        ),
      };
    }
  }

  return { ok: true, payload };
}
