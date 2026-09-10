import { z } from "zod";

export const BloodGroupSchema = z.enum([
    "A_POS",
    "A_NEG",
    "B_POS",
    "B_NEG",
    "AB_POS",
    "AB_NEG",
    "O_POS",
    "O_NEG",
]);

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
