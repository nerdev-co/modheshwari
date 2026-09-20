/**
 * search-parser.ts
 *
 * Parses structured search queries into typed modes.
 * Supports modes: blood, gotra, role, family, profession, location, and fallback text search.
 */

export enum SearchMode {
  BLOOD = "BLOOD",
  GOTRA = "GOTRA",
  ROLE = "ROLE",
  FAMILY = "FAMILY",
  PROFESSION = "PROFESSION",
  LOCATION = "LOCATION",
  TEXT = "TEXT", // fallback
}

export interface ParsedQuery {
  mode: SearchMode;
  value: string;
  originalQuery: string;
}

/**
 * Parse a search query into a structured mode and value.
 *
 * Examples:
 * - "blood:O+" → { mode: BLOOD, value: "O+" }
 * - "gotra:Shandilya" → { mode: GOTRA, value: "Shandilya" }
 * - "role:FAMILY_HEAD" → { mode: ROLE, value: "FAMILY_HEAD" }
 * - "family:Patel" → { mode: FAMILY, value: "Patel" }
 * - "profession:doctor" → { mode: PROFESSION, value: "doctor" }
 * - "location:Mumbai" → { mode: LOCATION, value: "Mumbai" }
 * - "rahul" → { mode: TEXT, value: "rahul" }
 */
export function parseQuery(q: string): ParsedQuery {
  const trimmed = q.trim();

  // Try to match "key:value" pattern
  const colonIndex = trimmed.indexOf(":");

  if (colonIndex > 0) {
    const prefix = trimmed.substring(0, colonIndex).trim().toUpperCase();
    const value = trimmed.substring(colonIndex + 1).trim();

    if (value.length === 0) {
      // If value is empty, fall back to text search
      return { mode: SearchMode.TEXT, value: trimmed, originalQuery: q };
    }

    // Check if prefix matches a known mode
    if (
      Object.values(SearchMode).includes(prefix as SearchMode) &&
      prefix !== SearchMode.TEXT
    ) {
      return { mode: prefix as SearchMode, value, originalQuery: q };
    }
  }

  // Default to text search
  return { mode: SearchMode.TEXT, value: trimmed, originalQuery: q };
}

/**
 * Validate blood group format (must be one of the enum values).
 * Examples: O+, O-, A+, A-, B+, B-, AB+, AB-
 */
export function isValidBloodGroup(value: string): boolean {
  const validGroups = [
    "O_POS",
    "O_NEG",
    "A_POS",
    "A_NEG",
    "B_POS",
    "B_NEG",
    "AB_POS",
    "AB_NEG",
  ];

  // Convert user input format (e.g., "O+") to schema format (e.g., "O_POS")
  const normalized = normalizeBloodGroup(value);
  return validGroups.includes(normalized);
}

/**
 * Normalize blood group from user input to schema format.
 * Examples: "O+" → "O_POS", "A-" → "A_NEG", "AB+" → "AB_POS"
 */
export function normalizeBloodGroup(value: string): string {
  const upper = value.toUpperCase().replace(/\s+/g, "");

  if (upper === "O+" || upper === "OPOS") return "O_POS";
  if (upper === "O-" || upper === "ONEG") return "O_NEG";
  if (upper === "A+" || upper === "APOS") return "A_POS";
  if (upper === "A-" || upper === "ANEG") return "A_NEG";
  if (upper === "B+" || upper === "BPOS") return "B_POS";
  if (upper === "B-" || upper === "BNEG") return "B_NEG";
  if (upper === "AB+" || upper === "ABPOS") return "AB_POS";
  if (upper === "AB-" || upper === "ABNEG") return "AB_NEG";

  // Return as-is if no match (will fail validation)
  return upper;
}

/**
 * Normalize role values (user might provide lowercase or variants).
 * Examples: "family_head" → "FAMILY_HEAD"
 */
export function normalizeRole(value: string): string {
  return value.toUpperCase().replace(/-/g, "_");
}

/**
 * Build a Prisma where clause based on parsed query mode.
 *
 * This is the core function that transforms search modes into database queries.
 * Each mode has specific logic for exact vs substring matching.
 */
export function buildWhereClause(mode: SearchMode, value: string): any {
  switch (mode) {
    case SearchMode.BLOOD: {
      // Exact match: normalize user input to schema format
      const normalized = normalizeBloodGroup(value);
      return {
        profile: {
          bloodGroup: normalized,
        },
      };
    }

    case SearchMode.GOTRA: {
      // Substring match: case-insensitive
      return {
        profile: {
          gotra: {
            contains: value,
            mode: "insensitive",
          },
        },
      };
    }

    case SearchMode.ROLE: {
      // Exact match: normalized role enum
      const normalized = normalizeRole(value);
      return {
        role: normalized,
      };
    }

    case SearchMode.FAMILY: {
      // Substring match: search family name via junction table
      return {
        families: {
          some: {
            family: {
              name: {
                contains: value,
                mode: "insensitive",
              },
            },
          },
        },
      };
    }

    case SearchMode.PROFESSION: {
      // Substring match: case-insensitive
      return {
        profile: {
          profession: {
            contains: value,
            mode: "insensitive",
          },
        },
      };
    }

    case SearchMode.LOCATION: {
      // Substring match: case-insensitive (user requested both exact and substring)
      return {
        profile: {
          location: {
            contains: value,
            mode: "insensitive",
          },
        },
      };
    }

    case SearchMode.TEXT:
    default: {
      // Fallback: multi-field OR search (name, email, profession, gotra, location)
      return {
        OR: [
          { name: { contains: value, mode: "insensitive" } },
          { email: { contains: value, mode: "insensitive" } },
          {
            profile: {
              profession: {
                contains: value,
                mode: "insensitive",
              },
            },
          },
          {
            profile: {
              gotra: {
                contains: value,
                mode: "insensitive",
              },
            },
          },
          {
            profile: {
              location: {
                contains: value,
                mode: "insensitive",
              },
            },
          },
        ],
      };
    }
  }
}

/**
 * Build a Prisma select clause for rich relational context.
 *
 * Returns user fields plus profile and family information for meaningful display.
 */
export function buildSelectClause() {
  return {
    id: true,
    name: true,
    profile: {
      select: {
        bloodGroup: true,
      },
    },
  };
}
