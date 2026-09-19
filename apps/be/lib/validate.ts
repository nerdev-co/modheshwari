import { z } from "zod";
import { failure } from "@modheshwari/utils/response";

/**
 * Performs validate body operation.
 * @param {Request} req - Description of req
 * @param {import("/Users/nalindalal/modheshwari/node_modules/zod/v4/classic/schemas").ZodType<T, unknown, import("/Users/nalindalal/modheshwari/node_modules/zod/v4/core/schemas").$ZodTypeInternals<T, unknown>>} schema - Description of schema
 * @returns {Promise<{ ok: true; data: T; } | { ok: false; response: Response; }>} Description of return value
 */
export async function validateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>,
): Promise<
  { ok: true; data: T } | { ok: false; response: Response }
> {
  const raw = await req.json().catch(() => null);
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join(", ");
    return {
      ok: false,
      response: failure(`Validation error: ${issues}`, "Validation Error", 400),
    };
  }
  return { ok: true, data: result.data };
}

/**
 * Performs validate query operation.
 * @param {Request} req - Description of req
 * @param {import("/Users/nalindalal/modheshwari/node_modules/zod/v4/classic/schemas").ZodType<T, unknown, import("/Users/nalindalal/modheshwari/node_modules/zod/v4/core/schemas").$ZodTypeInternals<T, unknown>>} schema - Description of schema
 * @returns {{ ok: true; data: T; } | { ok: false; response: Response; }} Description of return value
 */
export function validateQuery<T>(
  req: Request,
  schema: z.ZodSchema<T>,
): { ok: true; data: T } | { ok: false; response: Response } {
  const url = new URL(req.url);
  const raw: Record<string, unknown> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "query"}: ${i.message}`)
      .join(", ");
    return {
      ok: false,
      response: failure(`Validation error: ${issues}`, "Validation Error", 400),
    };
  }
  return { ok: true, data: result.data };
}
