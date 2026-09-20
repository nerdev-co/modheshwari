import { z } from "zod";

import { isValidBloodGroup } from "../utils/searchParser";

export const BloodGroupSchema = z.string().superRefine((val, ctx) => {
    if (!isValidBloodGroup(val)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid blood group. Use format like O+, A-, AB+, etc.",
        });
    }
});

export const RoleSchema = z.enum([
    "COMMUNITY_HEAD",
    "COMMUNITY_SUBHEAD",
    "GOTRA_HEAD",
    "FAMILY_HEAD",
    "MEMBER",
]);

export const EventStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const ApprovalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CHANGES_REQUESTED",
]);

export const NotificationChannelSchema = z.enum([
    "EMAIL",
    "IN_APP",
    "PUSH",
    "SMS",
]);

export const PrioritySchema = z.enum([
    "low",
    "normal",
    "high",
    "urgent",
    "CRITICAL",
]);
