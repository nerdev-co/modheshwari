import { z } from "zod";
import { failure } from "@modheshwari/utils/response";

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
