"use client";

import { useRouter } from "next/navigation";
import { LoaderFour } from "@repo/ui/loading";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { formatBloodGroup } from "@modheshwari/utils/format";

import { useUser } from "../../lib/UserContext";

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
  const router = useRouter();
  const { user, loading, logout } = useUser();

  if (loading) {
    return (
      <DreamySunsetBackground className="flex items-center justify-center min-h-screen">
        <LoaderFour text="Loading your profile..." />
      </DreamySunsetBackground>
    );
  }

  if (!user) return null;

  const initials = (user.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleColors: Record<string, string> = {
    COMMUNITY_HEAD: "bg-jewel-gold",
    COMMUNITY_SUBHEAD: "bg-jewel-600",
    GOTRA_HEAD: "bg-jewel-emerald",
    FAMILY_HEAD: "bg-jewel-500",
    MEMBER: "bg-jewel-400",
  };

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
            style={{ background: roleColors[user.role] || "#78716c" }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-semibold text-jewel-900">
                {user.name}
              </h1>
              <span className={`px-2 py-1 rounded text-xs font-semibold text-jewel-deep ${roleColors[user.role] || "bg-jewel-400"}`}>
                {user.role ? user.role.replace(/_/g, " ") : "Unknown"}
              </span>
              {statusChip}
            </div>
            <p className="text-sm text-jewel-500 mt-1">{user.email}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push("/me/edit")}>
              Edit profile
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                router.push("/signin");
              }}
            >
              Sign out
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-6">
            <h2 className="text-base font-display font-bold text-jewel-900 mb-4 flex items-center gap-2">
              <span>Personal Details</span>
              <span className="text-xs text-jewel-500 font-normal">Profile</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <ProfileField label="Profession" value={user.profile?.profession} />
              <ProfileField label="Gotra" value={user.profile?.gotra} />
              <ProfileField label="Blood Group" value={formatBloodGroup(user.profile?.bloodGroup)} />
              <ProfileField label="Location" value={user.profile?.location} />
              <ProfileField label="Phone" value={user.profile?.phone} />
              <ProfileField label="Address" value={user.profile?.address} />
            </div>
          </section>

          <section className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-6">
            <h2 className="text-base font-display font-bold text-jewel-900 mb-4 flex items-center gap-2">
              <span>Family Memberships</span>
              <span className="text-xs text-jewel-500 font-normal">Families</span>
            </h2>
            {!Array.isArray(user.families) || user.families.length === 0 ? (
              <div className="text-jewel-400 text-sm">No families linked.</div>
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
                    <span className="text-xs text-jewel-400">
                      Joined: {new Date(fm.joinedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="mt-8 bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-6">
          <h2 className="text-base font-display font-bold text-jewel-900 mb-4 flex items-center gap-2">
            <span>Activity & Notifications</span>
            <span className="text-xs text-jewel-500 font-normal">Recent</span>
          </h2>
          <div className="text-jewel-400 text-sm">No recent activity.</div>
        </section>
      </div>
    </DreamySunsetBackground>
  );
}
