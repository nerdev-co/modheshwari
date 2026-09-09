"use client";

import { useNavigate } from "react-router-dom";
import { LoaderFour } from "@repo/ui/loading";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { formatBloodGroup } from "@modheshwari/utils/format";

import { useUser } from "../../lib/UserContext";
import { ROLE_COLORS } from "../../lib/constants";
import { useLocale } from "../../lib/LocaleContext";

/**
 * @param {{ label: string; value?: string; }} {
 *   label,
 *   value,
 * } - Description of {
 *   label,
 *   value,
 * }
 */
function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="p-3 border border-jewel-400/20 rounded-xl bg-jewel-50/50">
      <div className="text-xs text-jewel-500">{label}</div>
      <div className="font-medium text-jewel-900">{value}</div>
    </div>
  );
}

export default function MePage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useUser();
  const { t } = useLocale();

  if (loading) {
    return (
      <DreamySunsetBackground className="flex items-center justify-center min-h-screen">
        <LoaderFour text="Loading your profile..." />
      </DreamySunsetBackground>
    );
  }

  if (!user) {
    navigate("/signin");
    return null;
  }

  const initials = (user.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const statusChip = user.status ? (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-jewel-emerald/20 text-jewel-emerald border border-jewel-emerald/30">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-jewel-200/50 text-jewel-600 border border-jewel-400/20">
      Inactive
    </span>
  );

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <section className="flex items-center gap-6 py-8 border-b border-jewel-400/20 mb-8">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-jewel-deep shadow-lg"
            style={{ background: ROLE_COLORS[user.role] || "#78716c" }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-semibold text-jewel-900">
                {user.name}
              </h1>
              <span className={`px-2 py-1 rounded text-xs font-semibold text-jewel-deep ${ROLE_COLORS[user.role] || "bg-jewel-400"}`}>
                {user.role ? user.role.replace(/_/g, " ") : "Unknown"}
              </span>
              {statusChip}
            </div>
            <p className="text-sm text-jewel-500 mt-1">{user.email}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/me/edit")}>
              {t("profile.editProfile")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                navigate("/signin");
              }}
            >
              {t("profile.signOut")}
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-base font-display font-bold text-jewel-900 mb-4 flex items-center gap-2">
              <span>{t("profile.personalDetails")}</span>
              <span className="text-xs text-jewel-500 font-normal">{t("profile.profileLabel")}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <ProfileField label={t("profile.profession")} value={user.profile?.profession} />
              <ProfileField label={t("profile.gotra")} value={user.profile?.gotra} />
              <ProfileField label={t("profile.bloodGroup")} value={formatBloodGroup(user.profile?.bloodGroup)} />
              <ProfileField label={t("profile.location")} value={user.profile?.location} />
              <ProfileField label={t("profile.phone")} value={user.profile?.phone} />
              <ProfileField label={t("profile.address")} value={user.profile?.address} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-display font-bold text-jewel-900 mb-4 flex items-center gap-2">
              <span>{t("profile.familyMemberships")}</span>
              <span className="text-xs text-jewel-500 font-normal">{t("profile.familiesLabel")}</span>
            </h2>
            {!Array.isArray(user.families) || user.families.length === 0 ? (
              <div className="text-jewel-500 text-sm">{t("profile.noFamilies")}</div>
            ) : (
              <ul className="space-y-3">
                {user.families.map((fm) => (
                  <li
                    key={fm.id}
                    className="border border-jewel-400/20 rounded-xl p-3 flex items-center gap-3 bg-jewel-50/50"
                  >
                    <span className="font-semibold text-jewel-700">
                      {fm.family.name}
                    </span>
                    <span className="text-xs text-jewel-500">
                      {fm.role.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-jewel-500">
                      Joined: {new Date(fm.joinedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-base font-display font-bold text-jewel-900 mb-4 flex items-center gap-2">
            <span>{t("profile.activity")}</span>
            <span className="text-xs text-jewel-500 font-normal">{t("profile.recentLabel")}</span>
          </h2>
          <div className="text-jewel-500 text-sm">{t("profile.noActivity")}</div>
        </Card>
      </div>
    </DreamySunsetBackground>
  );
}
