/**
 * Search endpoint with structured query modes.
 * Parses structured queries (blood:, gotra:, role:, family:, profession:, location:)
 * - Enforces per-IP rate limit (in-memory)
 * - Uses in-memory cache (in-memory TTL) with search-mode-aware keys
 *  - Supports exact and substring matches based on mode
 * - Falls back to full-text search for unstructured queries
 */

import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import {
  parsePagination,
  buildPaginationResponse,
} from "@modheshwari/utils/pagination";
import { isRateLimited } from "@modheshwari/utils/rateLimit";

import {
  parseQuery,
  SearchMode,
  isValidBloodGroup,
  normalizeRole,
  buildWhereClause,
  buildSelectClause,
} from "../utils/searchParser";
import elasticClient from "../lib/elastic";
import { logger } from "../lib/logger";

type CacheEntry = { ts: number; data: any };
const CACHE_TTL = 60 * 1000; // 60 seconds
const cache = new Map<string, CacheEntry>();

/**
 * GET /api/search?q=xxx
 *
 * Supported modes:
 * - ?q=blood:O+         (exact match)
 * - ?q=gotra:Shandilya  (substring, case-insensitive)
 * - ?q=role:FAMILY_HEAD (exact match, role enum)
 * - ?q=family:Patel     (substring, case-insensitive)
 * - ?q=profession:doctor (substring, case-insensitive)
 * - ?q=location:Mumbai  (exact and substring, case-insensitive)
 * - ?q=rahul            (fallback: searches name, email, profession, gotra, location)
 *
 *
 * Pagination:
 * - ?page=1&limit=20
 * - Default limit: 20, max limit: 100
 *
 * Cache behavior:
 * - Cached per search mode (blood:O+ != blood:A+)
 * - TTL: 60 seconds
 * - Cache key format: "{MODE}:{value_lowercase}"
 *
 * Rate limiting:
 * - 30 requests per 60 seconds per IP
 * - Sliding window algorithm (fair distribution)
 */
export async function handleSearch(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return failure("Query too short", "Validation Error", 400);
    }

    if (
      isRateLimited(req, {
        windowMs: 60_000,
        max: 30,
        scope: "search",
      })
    ) {
      return failure("Too many requests", "Rate Limit", 429);
    }

    // Parse structured query
    const parsed = parseQuery(q);

    // Parse pagination
    const { skip, take, page, limit } = parsePagination(
      {
        page: url.searchParams.get("page"),
        limit: url.searchParams.get("limit"),
      },
      20,
      100,
    );

    // Create cache key that includes search mode (highly specific)
    const cacheKey = `${parsed.mode}:${parsed.value.toLowerCase()}`;
    const now = Date.now();

    // Check cache first (avoid DB hit if possible)
    const cached = cache.get(cacheKey);
    if (cached && now - cached.ts < CACHE_TTL) {
      const cachedUsers = cached.data;
      // Apply pagination to cached results
      const paginatedUsers = cachedUsers.slice(skip, skip + take);
      return success(
        "Search results",
        buildPaginationResponse(
          paginatedUsers,
          cachedUsers.length,
          page,
          limit,
        ),
      );
    }

    // Validate mode-specific requirements before DB query
    if (parsed.mode === SearchMode.BLOOD) {
      if (!isValidBloodGroup(parsed.value)) {
        return failure(
          "Invalid blood group. Use format like O+, A-, AB+, etc.",
          "Validation Error",
          400,
        );
      }
    }

    if (parsed.mode === SearchMode.ROLE) {
      const validRoles = [
        "COMMUNITY_HEAD",
        "COMMUNITY_SUBHEAD",
        "GOTRA_HEAD",
        "FAMILY_HEAD",
        "MEMBER",
      ];
      const normalizedRole = normalizeRole(parsed.value);
      if (!validRoles.includes(normalizedRole)) {
        return failure(
          `Invalid role. Valid roles: ${validRoles.join(", ")}`,
          "Validation Error",
          400,
        );
      }
    }

    // Build dynamic where clause based on mode
    const where = buildWhereClause(parsed.mode, parsed.value);
    const select = buildSelectClause();

    // If Elasticsearch is available, prefer it for full-text and structured modes
    if (elasticClient) {
      try {
        // Build ES query depending on parsed.mode
        let esQuery: any = { bool: { must: [] as any[], filter: [] as any[] } };

        const value = parsed.value;

        if (parsed.mode === SearchMode.BLOOD) {
          esQuery.bool.filter.push({ term: { "profile.bloodGroup": value } });
        } else if (parsed.mode === SearchMode.ROLE) {
          esQuery.bool.filter.push({ term: { role: normalizeRole(value) } });
        } else if (parsed.mode === SearchMode.GOTRA) {
          esQuery.bool.must.push({ match_phrase: { "profile.gotra": value } });
        } else if (parsed.mode === SearchMode.PROFESSION) {
          esQuery.bool.must.push({ match: { "profile.profession": { query: value, fuzziness: "AUTO" } } });
        } else if (parsed.mode === SearchMode.LOCATION) {
          esQuery.bool.must.push({ match: { "profile.location": { query: value, fuzziness: "AUTO" } } });
        } else {
          // generic fallback multi-field search
          esQuery = {
            multi_match: {
              query: value,
              fields: ["name^3", "email^2", "profile.profession", "profile.gotra", "profile.location"],
              fuzziness: "AUTO",
            },
          };
        }

        const esBody: any = {
          query: esQuery,
          from: skip,
          size: take,
        };

        const res = await elasticClient.search({ index: "users", body: esBody });
        const hits = res.hits?.hits || [];
        const totalHits = typeof res.hits.total === "object" ? res.hits.total.value : res.hits.total || 0;

        const users = hits.map((h: any) => ({ ...h._source }));

        cache.set(cacheKey, { ts: now, data: users });

        return success("Search results", buildPaginationResponse(users, totalHits, page, limit));
      } catch (err) {
        logger.warn('Elasticsearch query failed, falling back to DB', err);
        // fall through to DB-based search
      }
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Execute search query with pagination
    const users = await prisma.user.findMany({
      where,
      select,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });

    // Cache results with mode-aware key
    // Important: TTL is short (60s) to avoid stale data for fast-changing fields
    cache.set(cacheKey, { ts: now, data: users });

    return success(
      "Search results",
      buildPaginationResponse(users, total, page, limit),
    );
  } catch (err) {
    logger.error("Search Error:", err);
    return failure("Internal Server Error", "Unexpected", 500);
  }
}
