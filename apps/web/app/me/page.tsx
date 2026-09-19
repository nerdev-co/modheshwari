"use client";

import { useNavigate } from "react-router-dom";
import { LoaderFour } from "@repo/ui/loading";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { formatBloodGroup } from "@modheshwari/utils/format";
import { motion } from "framer-motion";
import { MOTION_ENTER } from "@repo/ui/motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users2,
  Link2,
  Plus,
  Activity,
  Clock,
  ChevronRight,
} from "lucide-react";

import { useUser } from "../../lib/UserContext";
import { ROLE_COLORS, ROLE_COLORS_CSS } from "../../lib/constants";
import { useLocale } from "../../lib/LocaleContext";

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      {Icon && <Icon className="w-5 h-5 text-text-muted shrink-0 mt-0.5" aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-muted">{label}</div>
        <div className="text-base font-medium text-text-primary truncate">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="text-center py-10 px-4">
      {Icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4 mx-auto">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="font-display font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary text-sm mb-4 max-w-xs mx-auto">{description}</p>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick} className="w-auto">
          {action.label}
          <Plus className="w-4 h-4 ml-1" />
        </Button>
      )}
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
        <LoaderFour text={t("common.loading")} />
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

  const displayName = user.name?.trim() || t("profile.unnamedMember");
  const roleLabel = user.role ? user.role.replace(/_/g, " ") : t("profile.unknownRole");
  const roleColor = ROLE_COLORS[user.role] || "bg-neutral";
  const roleColorCss = ROLE_COLORS_CSS[user.role] || "var(--neutral-500)";
  const joinedDate = null; // User type doesn't have createdAt/joinedAt

  const statusBadge = user.status ? (
    <Badge variant="emerald" size="sm" dot>
      {t("common.active")}
    </Badge>
  ) : (
    <Badge variant="surface" size="sm" dot>
      {t("common.inactive")}
    </Badge>
  );

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const hasFamily = Array.isArray(user.families) && user.families.length > 0;
const families = user.families ?? [];
  const hasActivity = false; // TODO: connect to real activity feed

  return (
    <DreamySunsetBackground className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile Header */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION_ENTER}
          className="mb-10 pb-8 border-b border-border"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...MOTION_ENTER, delay: 0.1 }}
              className="flex-shrink-0"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-on-accent shadow-lg"
                style={{ background: roleColorCss }}
                aria-hidden="true"
              >
                {initials || "??"}
              </div>
            </motion.div>

            {/* Name & Meta */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...MOTION_ENTER, delay: 0.15 }}
              className="flex-1 min-w-0 text-center sm:text-left"
            >
              <h1 className="font-display font-semibold text-3xl text-text-primary">
                {displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={roleColor as any} size="md" solid>
                  {roleLabel}
                </Badge>
                {statusBadge}
              </div>
              <p className="mt-2 text-text-secondary">
                <span className="font-medium">{t("profile.memberSince")}</span>
                {joinedDate && <span className="ml-1">{joinedDate}</span>}
              </p>
              <p className="mt-1 text-text-muted text-sm flex items-center gap-1">
                <Mail className="w-4 h-4" aria-hidden="true" />
                {user.email}
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...MOTION_ENTER, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 self-center sm:self-stretch"
            >
              <Button
                onClick={() => navigate("/me/edit")}
                className="flex-1 sm:flex-none"
              >
                {t("profile.editProfile")}
              </Button>
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="flex-1 sm:flex-none"
              >
                {t("profile.signOut")}
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_ENTER, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* ABOUT */}
          <section className="space-y-6">
            <header className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-xl text-text-primary flex items-center gap-2">
                <User className="w-5 h-5 text-accent" aria-hidden="true" />
                {t("profile.about")}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/me/edit")}>
                {t("common.edit")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </header>

            <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden">
              <div className="p-5 space-y-1">
                <ProfileField
                  label={t("profile.profession")}
                  value={user.profile?.profession}
                  icon={Briefcase}
                />
                <ProfileField
                  label={t("profile.gotra")}
                  value={user.profile?.gotra}
                  icon={Users2}
                />
                <ProfileField
                  label={t("profile.bloodGroup")}
                  value={formatBloodGroup(user.profile?.bloodGroup)}
                  icon={Activity}
                />
                <ProfileField
                  label={t("profile.location")}
                  value={user.profile?.location}
                  icon={MapPin}
                />
                <ProfileField
                  label={t("profile.phone")}
                  value={user.profile?.phone}
                  icon={Phone}
                />
                <ProfileField
                  label={t("profile.address")}
                  value={user.profile?.address}
                  icon={MapPin}
                />
                <ProfileField
                  label={t("profile.email")}
                  value={user.email}
                  icon={Mail}
                />
              </div>
            </div>
            </section>

          {/* FAMILY */}
          <section className="space-y-6">
            <header className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-xl text-text-primary flex items-center gap-2">
                <Users2 className="w-5 h-5 text-accent" aria-hidden="true" />
                {t("profile.family")}
              </h2>
              {!hasFamily && (
                <Button variant="primary" size="sm" onClick={() => navigate("/families/create")}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t("profile.connectFamily")}
                </Button>
              )}
            </header>

            {hasFamily ? (
              <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden">
                {families.map((fm, index) => (
                  <motion.li
                    key={fm.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOTION_ENTER, delay: 0.1 + index * 0.05 }}
                    className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-surface-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                        {fm.family.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{fm.family.name}</p>
                        <p className="text-sm text-text-secondary flex items-center gap-1">
                          <Badge variant="accent" size="xs" solid>
                            {fm.role.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-text-muted">
                            {t("profile.joined")} {new Date(fm.joinedAt).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted" />
                  </motion.li>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={MOTION_ENTER}
                className="bg-surface-raised border border-border rounded-2xl p-8"
              >
                <EmptyState
                  title={t("profile.noFamilyTitle")}
                  description={t("profile.noFamilyDescription")}
                  action={{
                    label: t("profile.connectFamily"),
                    onClick: () => navigate("/families/create"),
                  }}
                  icon={Link2}
                />
              </motion.div>
            )}
          </section>
        </motion.div>

        {/* RECENT ACTIVITY */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_ENTER, delay: 0.3 }}
          className="mt-10"
        >
          <header className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-xl text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" aria-hidden="true" />
              {t("profile.recentActivity")}
            </h2>
          </header>

          <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden">
            {hasActivity ? (
              <div className="divide-y divide-border">
                {/* TODO: real activity feed */}
              </div>
            ) : (
              <EmptyState
                title={t("profile.noActivityTitle")}
                description={t("profile.noActivityDescription")}
                icon={Clock}
              />
            )}
          </div>
        </motion.section>
      </div>
    </DreamySunsetBackground>
  );
}