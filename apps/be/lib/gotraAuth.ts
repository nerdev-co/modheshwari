import prisma from "@modheshwari/db";

/**
 * Check if a GOTRA_HEAD is authorized to manage a target user's data.
 * Compares the GOTRA_HEAD's profile.gotra with the target user's profile.gotra.
 */
export async function canGotraHeadManageUser(
  gotraHeadId: string,
  targetUserId: string,
): Promise<{ ok: boolean; gotra?: string; reason?: string }> {
  const [head, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: gotraHeadId },
      select: { role: true, profile: { select: { gotra: true } } },
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { profile: { select: { gotra: true } } },
    }),
  ]);

  if (!head || head.role !== "GOTRA_HEAD") {
    return { ok: false, reason: "Not a GOTRA_HEAD" };
  }

  if (!head.profile?.gotra) {
    return { ok: false, reason: "GOTRA_HEAD has no gotra set" };
  }

  if (!target?.profile?.gotra) {
    return { ok: false, reason: "Target user has no gotra set" };
  }

  if (head.profile.gotra !== target.profile.gotra) {
    return { ok: false, reason: "Target user is not in your gotra" };
  }

  return { ok: true, gotra: head.profile.gotra };
}

/**
 * Check if a GOTRA_HEAD is authorized to manage a family.
 * Verifies at least one member of the family shares the same gotra.
 */
export async function canGotraHeadManageFamily(
  gotraHeadId: string,
  familyId: string,
): Promise<{ ok: boolean; gotra?: string; reason?: string }> {
  const head = await prisma.user.findUnique({
    where: { id: gotraHeadId },
    select: { role: true, profile: { select: { gotra: true } } },
  });

  if (!head || head.role !== "GOTRA_HEAD") {
    return { ok: false, reason: "Not a GOTRA_HEAD" };
  }

  if (!head.profile?.gotra) {
    return { ok: false, reason: "GOTRA_HEAD has no gotra set" };
  }

  // Check if any member of this family belongs to the same gotra
  const matchingMember = await prisma.familyMember.findFirst({
    where: {
      familyId,
      user: {
        profile: { gotra: head.profile.gotra },
      },
    },
  });

  if (!matchingMember) {
    return { ok: false, reason: "No family members match your gotra" };
  }

  return { ok: true, gotra: head.profile.gotra };
}

/**
 * Get the GOTRA_HEAD's gotra name, or null if not a GOTRA_HEAD.
 */
export async function getGotraHeadGotra(
  userId: string,
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, profile: { select: { gotra: true } } },
  });

  if (!user || user.role !== "GOTRA_HEAD" || !user.profile?.gotra) {
    return null;
  }

  return user.profile.gotra;
}
