import prisma from "@modheshwari/db";
import { verifyAuth } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";
import { logger } from "../lib/logger";

type MedicalBody = {
  bloodGroup?:
    | "A_POS"
    | "A_NEG"
    | "B_POS"
    | "B_NEG"
    | "AB_POS"
    | "AB_NEG"
    | "O_POS"
    | "O_NEG";
  allergies?: string;
  medicalNotes?: string;
};

// ---------------- UPDATE MEDICAL INFO ----------------
/**
 * Updates or creates medical information for the authenticated user
 * PATCH /api/profile/medical
 * Body: { bloodGroup?: string, allergies?: string, medicalNotes?: string }
 */
export async function handleUpdateMedical(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return failure("Unauthorized", null, 401);

  const userId = user.userId ?? user.id;
  if (!userId) return failure("Unauthorized: missing userId", null, 401);

  const body = (await req.json().catch(() => null)) as MedicalBody;
  if (!body || (!body.bloodGroup && !body.allergies && !body.medicalNotes)) {
    return failure("No medical info provided", null, 400);
  }

  // Validate blood group
  const validBloodGroups = [
    "A_POS",
    "A_NEG",
    "B_POS",
    "B_NEG",
    "AB_POS",
    "AB_NEG",
    "O_POS",
    "O_NEG",
  ];
  if (body.bloodGroup && !validBloodGroups.includes(body.bloodGroup)) {
    return failure("Invalid blood group", null, 400);
  }

  try {
    const updated = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(body.bloodGroup && { bloodGroup: body.bloodGroup }),
        ...(body.allergies !== undefined && { allergies: body.allergies }),
        ...(body.medicalNotes !== undefined && {
          medicalNotes: body.medicalNotes,
        }),
      },
      create: {
        userId,
        status: true,
        bloodGroup: body.bloodGroup ?? "O_POS",
        allergies: body.allergies || null,
        medicalNotes: body.medicalNotes || null,
      },
      select: {
        bloodGroup: true,
        allergies: true,
        medicalNotes: true,
      },
    });

    return success("Medical info updated", { profile: updated });
  } catch (err) {
    logger.error("Failed to update medical info:", err);
    return failure("Internal server error", null, 500);
  }
}

// ---------------- SEARCH BY BLOOD GROUP ----------------
/**
 * Search users by blood group for emergency medical purposes
 * GET /api/medical/search?bloodGroup=O_POS
 */
export async function handleSearchByBloodGroup(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return failure("Unauthorized", null, 401);

  const url = new URL(req.url);
  const bloodGroup = url.searchParams.get("bloodGroup");

  if (!bloodGroup) {
    return failure("Blood group parameter required", null, 400);
  }

  // Validate blood group format
  const validBloodGroups = [
    "A_POS",
    "A_NEG",
    "B_POS",
    "B_NEG",
    "AB_POS",
    "AB_NEG",
    "O_POS",
    "O_NEG",
  ];
  if (!validBloodGroups.includes(bloodGroup)) {
    return failure("Invalid blood group format", null, 400);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        status: true,
        profile: {
          bloodGroup: bloodGroup as any, // Matches enum value
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: {
            bloodGroup: true,
            phone: true,
            location: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const formattedData = users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      phone: u.profile?.phone,
      location: u.profile?.location,
      bloodGroup: u.profile?.bloodGroup,
    }));

    return success(
      `Found ${formattedData.length} user(s) with blood group ${bloodGroup}`,
      formattedData,
    );
  } catch (err) {
    logger.error("Search by blood group error:", err);
    return failure("Internal server error", null, 500);
  }
}
