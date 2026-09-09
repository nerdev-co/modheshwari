import { isRateLimited } from "@modheshwari/utils/rateLimit";

import { authRoutes } from "./authRoutes";
import { staticRoutes } from "./staticRoutes";
import { matchParameterizedRoute } from "./parameterizedRoutes";
import { withCorsHeaders, handleCors } from "../utils/cors";
import { logger } from "../lib/logger";

/**
 * Main request router
 * Handles CORS, rate limiting, and routes requests to appropriate handlers
 */
export async function router(req: Request): Promise<Response> {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname.toLowerCase();

  // Rate limiting check
  if (isRateLimited(req, { max: 100, windowMs: 60000 })) {
    return withCorsHeaders(
      Response.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      ),
    );
  }

  try {
    // 1. Try auth routes (signup/login)
    for (const route of authRoutes) {
      if (route.path === pathname && route.method === method) {
        return withCorsHeaders(await route.handler(req), req);
      }
    }

    // 2. Try static routes
    for (const route of staticRoutes) {
      if (route.path === pathname && route.method === method) {
        return withCorsHeaders(await route.handler(req), req);
      }
    }

    // 3. Try parameterized routes (with :id, etc.)
    const paramMatch = matchParameterizedRoute(pathname, method);
    if (paramMatch) {
      const { route, params } = paramMatch;

      // Validate required params exist
      const missingParams = Object.entries(params).filter(([_, v]) => !v);
      if (missingParams.length > 0) {
        const firstMissing = missingParams[0];
        return withCorsHeaders(
          Response.json(
            {
              error: `Missing required parameter: ${firstMissing ? firstMissing[0] : "unknown"}`,
            },
            { status: 400 },
          ),
          req,
        );
      }

      return withCorsHeaders(await route.handler(req, params), req);
    }

    // 4. No route matched - 404
    return withCorsHeaders(
      Response.json({ error: "Endpoint not found" }, { status: 404 }),
      req,
    );
  } catch (err) {
    logger.error("Request error:", err);
    return withCorsHeaders(
      Response.json({ error: "Internal server error" }, { status: 500 }),
      req,
    );
  }
}
