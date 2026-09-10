/**
 * Admin / Community-level auth handlers
 * Supports roles: COMMUNITY_HEAD, COMMUNITY_SUBHEAD, GOTRA_HEAD
 */

import prisma from "@modheshwari/db";
import { hashPassword, comparePassword } from "@modheshwari/utils/hash";
import { signJWT, signRefreshJWT } from "@modheshwari/utils/jwt";
import { failure } from "@modheshwari/utils/response";
import type { Role as PrismaRole } from "@prisma/client";
import { z } from "zod";

import { logger } from "../../lib/logger";
import { validateBody } from "../../lib/validate";
import { BloodGroupSchema } from "../../lib/sharedSchemas";

const ALLOWED_ROLES = [
    "COMMUNITY_HEAD",
    "COMMUNITY_SUBHEAD",
    "GOTRA_HEAD",
] as const;
type AdminRole = (typeof ALLOWED_ROLES)[number];

/**
 * Performs normalize role operation.
 * @param {string} raw - Description of raw
 * @returns {"COMMUNITY_HEAD" | "COMMUNITY_SUBHEAD" | "GOTRA_HEAD"} Description of return value
 */
function normalizeRole(raw?: string): AdminRole | undefined {
    if (!raw) return undefined;
    const up = raw.toUpperCase();
    return ALLOWED_ROLES.includes(up as AdminRole)
        ? (up as AdminRole)
        : undefined;
}
/**
 * Signup handler for community/admin roles.
 * POST /api/signup/:role
 */
const AdminSignupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    gotra: z.string().optional(),
    bloodGroup: BloodGroupSchema.optional(),
});
export async function handleAdminSignup(
    req: Request,
    role: string,
): Promise<Response> {
    try {
        const r = normalizeRole(role);
        if (!r)
            return failure(
                "Invalid role for this signup endpoint",
                "Bad Request",
                400,
            );

        // keep a stable, typed prismaRole before any awaits so narrowing isn't lost
        const prismaRole: PrismaRole = r as PrismaRole;

        const v = await validateBody(req, AdminSignupSchema);
        if (!v.ok) return v.response;
        const body = v.data;
        const { name, email, password, gotra, bloodGroup } = body;

        const existing = await prisma.user.findFirst({ where: { email } });
        if (existing)
            return failure("Email already registered", "Conflict", 409);

        const hashedPWD = await hashPassword(password);

        // If gotra provided, create/update profile
        const user = await prisma.$transaction(async (tx) => {
            const u = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPWD,
                    role: prismaRole,
                    status: true,
                },
            });

            const profileData: any = {
                userId: u.id,
                gotra: gotra ?? null,
                status: true,
            };
            if (bloodGroup) profileData.bloodGroup = bloodGroup;
            await tx.profile.create({
                data: profileData,
            });

            return u;
        });

        const token = signJWT({
            userId: user.id,
            role: user.role,
        });
        const refreshToken = signRefreshJWT({ userId: user.id });
        const headers = new Headers();
        headers.append(
            "Set-Cookie",
            `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800; Secure`,
        );
        return new Response(
            JSON.stringify({
                status: "success",
                message: "Signup successful",
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    },
                    token,
                },
            }),
            { status: 201, headers },
        );
    } catch (err) {
        logger.error("Admin Signup Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/**
 * Login handler for community/admin roles.
 * POST /api/login/:role
 */
const AdminLoginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});
export async function handleAdminLogin(
    req: Request,
    expectedRole: string,
): Promise<Response> {
    try {
        const r = normalizeRole(expectedRole);
        if (!r)
            return failure(
                "Invalid role for this login endpoint",
                "Forbidden",
                403,
            );

        // keep typed value before any await so TypeScript knows it's present
        const prismaRole: PrismaRole = r as unknown as PrismaRole;

        const v = await validateBody(req, AdminLoginSchema);
        if (!v.ok) return v.response;
        const body = v.data;
        const { email, password } = body;

        const user = await prisma.user.findFirst({
            where: { email, role: prismaRole },
        });

        if (!user)
            return failure(
                "User not found or role mismatch",
                "Unauthorized",
                401,
            );

        if (user.status === false) {
            return failure("Account is inactive", "Unauthorized", 401);
        }

        const ok = await comparePassword(password, user.password);
        if (!ok)
            return failure("Invalid credentials", "Authentication Error", 401);

        const token = signJWT({
            userId: user.id,
            role: user.role,
        });
        const refreshToken = signRefreshJWT({ userId: user.id });
        const headers = new Headers();
        headers.append(
            "Set-Cookie",
            `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800; Secure`,
        );
        return new Response(
            JSON.stringify({
                status: "success",
                message: "Login successful",
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    },
                },
            }),
            { status: 200, headers },
        );
    } catch (err) {
        logger.error("Login Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}
