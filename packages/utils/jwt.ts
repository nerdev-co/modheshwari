//auth continuation — managing session identity after login.
import { join } from "path";
import { fileURLToPath } from "url";

import { config } from "dotenv";
import jwt from "jsonwebtoken";

// Load .env from monorepo root if not already loaded
const dir =
  typeof process !== "undefined" && process.cwd
    ? process.cwd()
    : typeof __dirname !== "undefined"
      ? __dirname
      : fileURLToPath(import.meta.url);
if (dir) {
  config({ path: join(dir, "../../.env") });
}

// Read secrets lazily so missing env vars don't crash module load time
function getSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment variables");
  }
  return process.env.JWT_SECRET;
}

function getRefreshSecret(): string {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("Missing JWT_REFRESH_SECRET in environment variables");
  }
  return process.env.JWT_REFRESH_SECRET;
}

export interface AuthPayload {
  userId?: string;
  id?: string;
  email?: string;
  role?: string;
}

/**
 * Signs an access JWT token for the given payload.
 * @param payload - The data to embed in the token.
 * @returns A signed JWT valid for 15 minutes.
 */
export function signJWT(payload: AuthPayload) {
  // Ensure compatibility: include both `userId` and `id` fields when possible.
  const p: Record<string, unknown> = { ...(payload as Record<string, unknown>) };
  if (payload.userId && !p.id) p.id = payload.userId;
  if (payload.id && !p.userId) p.userId = payload.id;
  return jwt.sign(p, getSecret(), { expiresIn: "15m" });
}

/**
 * Verifies a JWT and returns its decoded payload, or null if invalid.
 * @param token - The JWT string to verify.
 * @returns Decoded payload or null on failure.
 */
export function verifyJWT(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getSecret()) as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Verifies Authorization header and returns decoded user payload, or null.
 */
export async function verifyAuth(req: Request): Promise<AuthPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  return verifyJWT(token);
}

/**
 * Signs a refresh JWT token for the given payload.
 * @param payload - The data to embed in the token.
 * @returns A signed JWT valid for 7 days (refresh token).
 */
export function signRefreshJWT(payload: AuthPayload) {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: "7d" });
}

/**
 * Verifies a refresh JWT and returns its decoded payload, or null if invalid.
 * @param token - The JWT string to verify.
 * @returns Decoded payload or null on failure.
 */
export function verifyRefreshJWT(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getRefreshSecret()) as AuthPayload;
  } catch {
    return null;
  }
}