import prisma from "@modheshwari/db";
import { comparePassword, hashPassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

import { logger } from "../../lib/logger";

/**
 * @description Handles Family Member login flow.
 * Steps:
 *   1. Validate request body.
 *   2. Ensure user exists and role is MEMBER.
 *   3. Verify password.
 *   4. Fetch joined family info.
 *   5. Return JWT and member + family details.
 */

/**
 * @typedef {Object} MemberLoginBody
 * @property {string} email - Registered member email.
 * @property {string} password - Raw password.
 */

/**
 * Handles login for Family Member users.
 *
 * @async
 * @function handleMemberLogin
 * @route POST /api/signin/member
 * @param {Request} req - The HTTP request object.
 * @returns {Promise<Response>} HTTP JSON response.
 */
export async function handleMemberLogin(req: Request) {
  try {
    const body: any = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { email, password } = body;

    // --- Step 1: Input validation ---
    if (!email || !password)
      return failure("Missing required fields", "Validation Error", 400);

    // --- Step 2: Ensure user exists ---
    // --- Fetch user by email ---
    const user = await prisma.user.findFirst({
      where: { email, role: "MEMBER" },
      include: { families: { include: { family: true } } },
    });
    if (!user) return failure("User not found", "Not Found", 404);

    // --- Block login if user is marked deceased/inactive ---
    // `status` is a boolean in the Prisma `User` model (true = alive, false = deceased)
    if (user.status === false) {
      return failure(
        "Account is inactive or marked deceased",
        "Unauthorized",
        403,
      );
    }

    // --- Step 3: Verify password ---
    const isValid = await comparePassword(password, user.password);
    if (!isValid)
      return failure("Invalid credentials", "Authentication Error", 401);

    // --- Step 4: Fetch family info (if any) ---
    const familyLinks = user.families.map((f: any) => ({
      id: f.family.id,
      name: f.family.name,
      uniqueId: f.family.uniqueId,
    }));

    // --- Step 5: Sign JWT token ---
    const token = signJWT({ userId: user.id, role: user.role });

    // --- Step 6: Respond with structured payload ---
    return success(
      "Login successful",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        families: familyLinks,
        token,
      },
      200,
    );
  } catch (err) {
    logger.error("MemberLogin Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * @description Handles Family Member signup (join request flow).
 * Steps:
 *   1. Validate request body.
 *   2. Ensure email is unique.
 *   3. Hash password securely.
 *   4. Create a User with role = MEMBER.
 *   5. Create a FamilyJoinRequest entry.
 *   6. Notify the Family Head.
 *   7. Return success (no JWT yet — pending approval).
 */

/**
 * Performs handle family member signup operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleMemberSignup(req: Request) {
  try {
    const body: any = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { name, email, password, familyId } = body;

    // --- Step 1: Input validation ---
    if (!name || !email || !password || !familyId)
      return failure("Missing required fields", "Validation Error", 400);

    // --- Step 2: Check if email already exists ---
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser)
      return failure("Email already registered", "Duplicate Entry", 409);

    // --- Step 3: Hash password securely ---
    const hashedPassword = await hashPassword(password);

    // --- Step 4: Create the User (role = MEMBER) ---
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "MEMBER",
          status: true,
        },
      });

      await tx.profile.create({
        data: {
          userId: u.id,
          status: true,
        },
      });

      return u;
    });

    // --- Step 5: Create Member Invite (Pending approval) ---
    const joinRequest = await prisma.memberInvite.create({
      data: {
        invitedUserId: user.id,
        familyId,
        status: "PENDING",
      },
    });

    // --- Step 6: Notify the Family Head ---
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true, name: true, headId: true },
    });

    if (family?.headId) {
      await prisma.notification.create({
        data: {
          userId: family.headId,
          type: "family_join_request" as any,
          message: `${user.name} has requested to join your family (${family.name}).`,
        },
      });
    }

    // --- Step 7: Return success response (no login yet) ---
    return success(
      "Signup successful — pending approval from family head.",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        joinRequest: {
          id: joinRequest.id,
          familyId: joinRequest.familyId,
          status: joinRequest.status,
        },
      },
      201,
    );
  } catch (err) {
    logger.error("MemberSignup Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
