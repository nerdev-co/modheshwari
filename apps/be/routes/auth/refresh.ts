import {
  verifyRefreshJWT,
  signJWT,
  signRefreshJWT,
} from "@modheshwari/utils/jwt";
import { failure } from "@modheshwari/utils/response";
import prisma from "@modheshwari/db";

/**
 * POST /api/refresh
 * Validates refresh token from cookie, issues new access token.
 */
export async function handleRefresh(req: Request): Promise<Response> {
  try {
    const cookie = req.headers.get("cookie") || "";
    const refreshToken = getCookie(cookie, "refreshToken");
    if (!refreshToken)
      return failure("Missing refresh token", "Auth Error", 401);

    const payload = verifyRefreshJWT(refreshToken);
    if (!payload || !payload.userId)
      return failure("Invalid refresh token", "Auth Error", 401);

    // Optionally check user existence/status
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) return failure("User not found", "Auth Error", 401);

    // Issue new access token
    const accessToken = signJWT({ userId: user.id, role: user.role });
    // Optionally issue new refresh token
    const newRefreshToken = signRefreshJWT({ userId: user.id });

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append(
      "Set-Cookie",
      `refreshToken=${newRefreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800; Secure`,
    );

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Token refreshed",
        data: { accessToken },
        error: null,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers },
    );
  } catch {
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Performs get cookie operation.
 * @param {string} cookieHeader - Description of cookieHeader
 * @param {string} name - Description of name
 * @returns {string} Description of return value
 */
function getCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(^|; )${name}=([^;]*)`));
  if (match && typeof match[2] === "string" && match[2] !== undefined) {
    return decodeURIComponent(match[2]);
  }
  return null;
}
