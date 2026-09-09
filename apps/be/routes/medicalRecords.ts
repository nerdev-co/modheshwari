import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { parsePagination, buildPaginationResponse } from "@modheshwari/utils/pagination";

import { requireAuth } from "./authMiddleware";
import { logger } from "../lib/logger";

/**
 * Creates a medical record for a user.
 *
 * Role-based permissions:
 * - Any authenticated user can create a record for themselves.
 * - Only COMMUNITY_HEAD and COMMUNITY_SUBHEAD can create
 *   records for other users (by specifying `userId` in the body).
 *
 * @async
 * @function handleCreateMedicalRecord
 * @route POST /api/medical-records
 * @param {Request} req - The incoming HTTP request. The body
 *   may contain `userId` (string, optional — only admins can
 *   set this), `bloodType`, `allergies`, `conditions`,
 *   `medications`, and `notes` (all optional strings).
 * @returns {Promise<Response>} JSON response with the created
 *   medical record on success, or an error message with HTTP
 *   status code on failure.
 */
export async function handleCreateMedicalRecord(req: Request): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const body: any = await req.json().catch(() => null);
        if (!body) return failure("Missing body", "Validation Error", 400);

        const targetUserId = body.userId ?? (auth.payload.userId || auth.payload.id);

        // Only admins may create for other users
        if (body.userId && auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
            return failure("Forbidden", "Forbidden", 403);
        }

        const rec = await prisma.medicalRecord.create({
            data: {
                userId: targetUserId,
                bloodType: body.bloodType ?? null,
                allergies: body.allergies ?? null,
                conditions: body.conditions ?? null,
                medications: body.medications ?? null,
                notes: body.notes ?? null,
            },
        });

        return success("Medical record created", { record: rec }, 201);
    } catch (err) {
        logger.error("CreateMedicalRecord Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/**
 * Lists medical records with pagination.
 *
 * Role-based permissions:
 * - COMMUNITY_HEAD and COMMUNITY_SUBHEAD can view all
 *   records (optionally filtered by `userId` query param).
 * - Other roles can only view their own records.
 *
 * @async
 * @function handleListMedicalRecords
 * @route GET /api/medical-records
 * @param {Request} req - The incoming HTTP request. Supports
 *   query parameters `userId` (admin-only filter),
 *   `page` (pagination page), and `limit` (items per page,
 *   max 100).
 * @returns {Promise<Response>} JSON response with a
 *   paginated list of medical records on success, or an
 *   error message with HTTP status code on failure.
 */
export async function handleListMedicalRecords(req: Request): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const url = new URL(req.url);
        const { skip, take, page, limit } = parsePagination(
            { page: url.searchParams.get("page"), limit: url.searchParams.get("limit") },
            20,
            100,
        );

        const where: any = {};
        // optional filter by userId (admins) or default to current user
        const qUserId = url.searchParams.get("userId");
        if (qUserId) {
            if (auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
                return failure("Forbidden", "Forbidden", 403);
            }
            where.userId = qUserId;
        } else {
            where.userId = auth.payload.userId ?? auth.payload.id;
        }

        const total = await prisma.medicalRecord.count({ where });
        const list = await prisma.medicalRecord.findMany({ where, orderBy: { createdAt: "desc" }, skip, take });

        return success("Medical records fetched", buildPaginationResponse(list, total, page, limit));
    } catch (err) {
        logger.error("ListMedicalRecords Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/**
 * Retrieves a single medical record by ID.
 *
 * Role-based permissions:
 * - The record owner can view their own record.
 * - COMMUNITY_HEAD and COMMUNITY_SUBHEAD can view
 *   any record.
 *
 * @async
 * @function handleGetMedicalRecord
 * @route GET /api/medical-records/:id
 * @param {Request} req - The incoming HTTP request.
 * @param {string} id - The UUID of the medical record
 *   to retrieve.
 * @returns {Promise<Response>} JSON response with the
 *   medical record on success, or an error message with
 *   HTTP status code on failure.
 */
export async function handleGetMedicalRecord(req: Request, id: string): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const rec = await prisma.medicalRecord.findUnique({ where: { id } });
        if (!rec) return failure("Not found", "Not Found", 404);

        // Only owner or admins
        const uid = auth.payload.userId ?? auth.payload.id;
        if (rec.userId !== uid && auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
            return failure("Forbidden", "Forbidden", 403);
        }

        return success("Medical record fetched", { record: rec });
    } catch (err) {
        logger.error("GetMedicalRecord Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/**
 * Updates a medical record by ID.
 *
 * Role-based permissions:
 * - The record owner can update their own record.
 * - COMMUNITY_HEAD and COMMUNITY_SUBHEAD can
 *   update any record.
 *
 * @async
 * @function handleUpdateMedicalRecord
 * @route PATCH /api/medical-records/:id
 * @param {Request} req - The incoming HTTP request.
 *   The body may contain any subset of `bloodType`,
 *   `allergies`, `conditions`, `medications`, and
 *   `notes` (all optional strings).
 * @param {string} id - The UUID of the medical record
 *   to update.
 * @returns {Promise<Response>} JSON response with the
 *   updated medical record on success, or an error
 *   message with HTTP status code on failure.
 */
export async function handleUpdateMedicalRecord(req: Request, id: string): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const rec = await prisma.medicalRecord.findUnique({ where: { id } });
        if (!rec) return failure("Not found", "Not Found", 404);

        const uid = auth.payload.userId ?? auth.payload.id;
        if (rec.userId !== uid && auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
            return failure("Forbidden", "Forbidden", 403);
        }

        const body: any = await req.json().catch(() => null);
        if (!body) return failure("Missing body", "Validation Error", 400);

        const updated = await prisma.medicalRecord.update({
            where: { id },
            data: {
                bloodType: body.bloodType ?? rec.bloodType,
                allergies: body.allergies ?? rec.allergies,
                conditions: body.conditions ?? rec.conditions,
                medications: body.medications ?? rec.medications,
                notes: body.notes ?? rec.notes,
            },
        });

        return success("Medical record updated", { record: updated });
    } catch (err) {
        logger.error("UpdateMedicalRecord Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/**
 * Deletes a medical record by ID.
 *
 * Role-based permissions:
 * - The record owner can delete their own record.
 * - COMMUNITY_HEAD and COMMUNITY_SUBHEAD can
 *   delete any record.
 *
 * @async
 * @function handleDeleteMedicalRecord
 * @route DELETE /api/medical-records/:id
 * @param {Request} req - The incoming HTTP request.
 * @param {string} id - The UUID of the medical record
 *   to delete.
 * @returns {Promise<Response>} JSON response confirming
 *   deletion on success, or an error message with HTTP
 *   status code on failure.
 */
export async function handleDeleteMedicalRecord(req: Request, id: string): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const rec = await prisma.medicalRecord.findUnique({ where: { id } });
        if (!rec) return failure("Not found", "Not Found", 404);

        const uid = auth.payload.userId ?? auth.payload.id;
        if (rec.userId !== uid && auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
            return failure("Forbidden", "Forbidden", 403);
        }

        await prisma.medicalRecord.delete({ where: { id } });
        return success("Medical record deleted", null);
    } catch (err) {
        logger.error("DeleteMedicalRecord Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

export default {};
