/**
 * @description Handles user login for specific roles (e.g., FAMILY_HEAD, COMMUNITY_HEAD).
 * Validates credentials, checks role, and returns a signed JWT if successful.
 */

import { randomUUID } from "crypto";

import prisma from "@modheshwari/db";
import { comparePassword, hashPassword } from "@modheshwari/utils/hash";
import { signJWT, signRefreshJWT } from "@modheshwari/utils/jwt";
import { failure } from "@modheshwari/utils/response";
import type { Role as PrismaRole } from "@prisma/client";
import { z } from "zod";

import { logger } from "../../lib/logger";
import { validateBody } from "../../lib/validate";

/**
 * Handles user login for a specific role.
 *
 * @async
 * @function handleLogin
 * @param {Request} req - The incoming HTTP request containing login credentials.
 * @param {string} expectedRole - The role to validate against (e.g., "FAMILY_HEAD").
 * @returns {Promise<Response>} JSON response with token and user details or error message.
 *
 * @example
 * // Endpoint usage
 * POST /api/login/familyhead
 * Body: { "email": "john@example.com", "password": "secret123" }
 *
 * // Response (success)
 * {
 *   "message": "Logged in successfully",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
 *   "user": { "id": 1, "name": "John Doe", "role": "FAMILY_HEAD" }
 * }
 */
const FHSigninSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function handleFHLogin(
  req: Request,
  expectedRole: string,
): Promise<Response> {
  try {
    const v = await validateBody(req, FHSigninSchema);
    if (!v.ok) return v.response;
    const body = v.data;
    const { email, password } = body;

    // --- Fetch user by email and expected role ---
    const user = await prisma.user.findFirst({
      where: { email, role: expectedRole as PrismaRole },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        status: true,
      },
    });

    // --- Verify existence and role match ---
    if (!user || user.role !== expectedRole)
      return failure(
        `You are not authorized as ${expectedRole}`,
        "Unauthorized",
        401,
      );

    // --- Block login if user is marked deceased/inactive ---
    // `status` is a boolean in the Prisma `User` model (true = alive, false = deceased)
    if (user.status === false) {
      return failure(
        "Account is inactive or marked deceased",
        "Unauthorized",
        403,
      );
    }

    // --- Compare password with stored hash ---
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return failure("Invalid credentials", "Authentication Error", 401);
    }

    // --- Generate JWT token ---
    // Standardize token payload to { userId, role }
    const token = signJWT({ userId: user.id, role: user.role });
    const refreshToken = signRefreshJWT({ userId: user.id });
    const headers = new Headers();
    headers.append("Set-Cookie", `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800; Secure`);
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
      { status: 200, headers }
    );
  } catch (err) {
    logger.error("Login Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * @description Handles FamilyHead signup flow.
 * Steps:
 *   1. Validate request body.
 *   2. Ensure email is unique.
 *   3. Hash password securely.
 *   4. Create a User with role = FAMILY_HEAD.
 *   5. Create an associated Family entry.
 *   6. Link the FamilyHead as a FamilyMember.
 *   7. Return JWT and created records.
 */

/**
 * @typedef {Object} SignupBody
 * @property {string} name - Full name of the Family Head.
 * @property {string} email - Email address (must be unique).
 * @property {string} password - Raw password to hash.
 * @property {string} familyName - Name of the new family to be created.
 */

/**
 * Handles signup for FamilyHead users.
 *
 * @async
 * @function handleSignup
 * @route POST /api/signup/familyhead
 * @param {Request} req - The HTTP request object.
 * @param {string} role - The user role ("FAMILY_HEAD").
 * @returns {Promise<Response>} HTTP JSON response.
 */
const FHSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  familyName: z.string().min(1, "Family name is required"),
});

export async function handleFHSignup(
  req: Request,
  role: string,
): Promise<Response> {
  try {
    // Validate role early and create a typed prismaRole before any await
    const rawRole = role?.toUpperCase();
    if (rawRole !== "FAMILY_HEAD") {
      return failure(
        "Invalid role for this signup endpoint",
        "Bad Request",
        400,
      );
    }
    const prismaRole: PrismaRole = "FAMILY_HEAD" as unknown as PrismaRole;

    const v = await validateBody(req, FHSignupSchema);
    if (!v.ok) return v.response;
    const body = v.data;
    const { name, email, password, familyName } = body;

    // --- Step 2: Check if email already exists ---
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return failure("Email already registered", "Duplicate Entry", 409);
    }

    // --- Step 3: Hash password securely ---
    const hashedPassword = await hashPassword(password);

    // --- Step 4-6: Create user + family + link as FamilyHead atomically ---
    const { user, family } = await prisma.$transaction(async (tx) => {
      // --- Step 4: Create Family Head user ---
      const u = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: prismaRole,
          status: true,
        },
      });

      // --- Step 6: Create Profile ---
      await tx.profile.create({
        data: {
          userId: u.id,
          status: true,
          bloodGroup: "O_POS",
        },
      });

      // --- Step 7: Prompt user to update blood group ---
      await tx.notification.create({
        data: {
          userId: u.id,
          type: "GENERIC",
          message:
            "Welcome! Please update your blood group in your profile settings. This is important for emergency medical matching.",
        },
      });

      // --- Step 8: Create Family entry ---
      const f = await tx.family.create({
        data: {
          name: familyName,
          uniqueId: `FAM-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
          headId: u.id,
        },
      });

      // --- Step 8: Link Family Head as FamilyMember ---
      await tx.familyMember.create({
        data: {
          familyId: f.id,
          userId: u.id,
          role: prismaRole,
        },
      });

      return { user: u, family: f };
    });

    // --- Step 9: Generate JWT token ---
    const token = signJWT({ userId: user.id, role: user.role });
    const refreshToken = signRefreshJWT({ userId: user.id });
    const headers = new Headers();
    headers.append("Set-Cookie", `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800; Secure`);
    logger.info(
      `Signup successful: ${user.name} (${user.email}) — Family: ${family.name} (${family.id})`,
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
          family: {
            id: family.id,
            name: family.name,
            uniqueId: family.uniqueId,
          },
          token,
        },
      }),
      { status: 201, headers }
    );
  } catch (err) {
    logger.error("Signup Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
