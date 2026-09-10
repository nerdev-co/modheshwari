import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { z } from "zod";

import { requireAuth } from "./authMiddleware";
import { validateBody, validateQuery } from "../lib/validate";
import { BloodGroupSchema } from "../lib/sharedSchemas";
import { logger } from "../lib/logger";

const UpdateMedicalSchema = z
    .object({
        bloodGroup: BloodGroupSchema.optional(),
        allergies: z.string().optional(),
        medicalNotes: z.string().optional(),
    })
    .refine((data) => data.bloodGroup || data.allergies || data.medicalNotes, {
        message: "At least one field must be provided",
    });

const SearchByBloodGroupSchema = z.object({
    bloodGroup: BloodGroupSchema,
});

// ---------------- UPDATE MEDICAL INFO ----------------
/**
 * Updates or creates medical information for the authenticated user
 * PATCH /api/profile/medical
 * Body: { bloodGroup?: string, allergies?: string, medicalNotes?: string }
 */
export async function handleUpdateMedical(req: Request) {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = (auth.payload.userId ?? auth.payload.id) as string;

    const v = await validateBody(req, UpdateMedicalSchema);
    if (!v.ok) return v.response;
    const body = v.data;

    try {
        const updated = await prisma.profile.upsert({
            where: { userId },
            update: {
                ...(body.bloodGroup && { bloodGroup: body.bloodGroup }),
                ...(body.allergies !== undefined && {
                    allergies: body.allergies,
                }),
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
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    const qv = validateQuery(req, SearchByBloodGroupSchema);
    if (!qv.ok) return qv.response;
    const { bloodGroup } = qv.data;

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
