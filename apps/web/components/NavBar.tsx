"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  Home,
  Users,
  Package,
  BellPlus,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  MessageCircle,
  Stethoscope,
} from "lucide-react";

import { useUser } from "../lib/UserContext";
import Tooltip from "./Tooltip";
import useNotifications from "../hooks/useNotifications";

/**
 * Performs  nav bar operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const isActive = (href: string) => pathname === href;

  const NavIcon = ({
    href,
    Icon,
    title,
  }: {
    href: string;
    Icon: ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <Link href={href}>
      <Tooltip text={title}>
        <div
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            isActive(href)
              ? "bg-jewel-gold/15 text-jewel-gold"
              : "text-jewel-600 hover:text-jewel-gold hover:bg-jewel-100 dark:text-jewel-400 dark:hover:text-jewel-gold dark:hover:bg-jewel-800/50"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </Tooltip>
    </Link>
  );

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const roleColors: Record<string, string> = {
    COMMUNITY_HEAD: "bg-jewel-gold",
    COMMUNITY_SUBHEAD: "bg-jewel-600",
    GOTRA_HEAD: "bg-jewel-emerald",
    FAMILY_HEAD: "bg-jewel-500",
    MEMBER: "bg-jewel-400",
  };

  return (
    <>
      <div className="h-20" />

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center h-14
          rounded-full border border-jewel-400/20
          bg-jewel-50/80 backdrop-blur-xl backdrop-saturate-150
          shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.08)]
          dark:bg-jewel-900/80 dark:border-jewel-400/10
          dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.3)]
          px-2"
      >
        <Link href="/" className="flex items-center gap-2 pl-3 pr-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-jewel-gold to-jewel-500 flex items-center justify-center text-jewel-deep text-sm font-bold shadow-lg shadow-jewel-gold/30">
            M
          </div>
          <span className="hidden sm:block text-jewel-900 dark:text-jewel-100 font-display font-bold text-sm">
            Modheshwari
          </span>
        </Link>

        <div className="h-6 w-px bg-jewel-400/20 dark:bg-jewel-400/10 mx-1" />

        {!loading && (
          <div className="hidden md:flex items-center gap-0.5">
            <NavIcon href="/" Icon={Home} title="Home" />
            <NavIcon href="/contact" Icon={Phone} title="Contact" />
            <NavIcon href="/search" Icon={Search} title="Search" />

            {user && (
              <>
                <NavIcon href="/family" Icon={Users} title="Family" />
                <NavIcon href="/medical" Icon={Stethoscope} title="Medical" />
                <NavIcon href="/resources" Icon={Package} title="Resources" />
                <NavIcon href="/nearby" Icon={MapPin} title="Nearby" />
                <NavIcon href="/events/calendar" Icon={Calendar} title="Calendar" />
                <NavIcon href="/notifications" Icon={BellPlus} title="Notifications" />
                <NavIcon href="/chat" Icon={MessageCircle} title="Chat" />
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 ml-1">
          {!loading && !user && (
            <Link
              href="/signin"
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-jewel-gold to-jewel-500 text-jewel-deep text-xs font-semibold
                hover:shadow-lg hover:shadow-jewel-gold/25 transition-all duration-300 hover:scale-[1.03]"
            >
              Sign in
            </Link>
          )}

          {!loading && user && (
            <>
              <Link
                href="/notifications"
                className="md:hidden relative p-2.5 rounded-xl text-jewel-600 hover:text-jewel-gold hover:bg-jewel-100 dark:text-jewel-400 dark:hover:bg-jewel-800/50 transition-all"
              >
                <BellPlus className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jewel-ruby opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-jewel-ruby" />
                  </span>
                )}
              </Link>

              <div className="relative group">
                <button
                  onClick={() => router.push("/me")}
                  className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-jewel-deep
                    ring-2 ring-offset-1 ring-offset-jewel-50 dark:ring-offset-jewel-900
                    shadow-lg hover:scale-[1.05] transition-transform duration-200"
                  style={{ background: roleColors[user.role] || "#78716c" }}
                  title="Profile"
                >
                  {initials}
                </button>

                <div className="hidden group-hover:block absolute right-0 mt-3 w-56
                  bg-jewel-50/95 dark:bg-jewel-900/95 backdrop-blur-xl
                  border border-jewel-400/20 dark:border-jewel-400/10
                  rounded-2xl shadow-elevated z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-jewel-400/20 dark:border-jewel-400/10">
                    <div className="font-medium text-sm text-jewel-900 dark:text-jewel-100">
                      {user.name}
                    </div>
                    <div className="text-xs text-jewel-500 mt-0.5">
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold text-jewel-deep ${roleColors[user.role] || "bg-jewel-400"}`}>
                        {user.role ? user.role.replace(/_/g, " ") : "Unknown"}
                      </span>
                      {user.status ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-jewel-emerald/20 text-jewel-emerald border border-jewel-emerald/30">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-jewel-200/50 text-jewel-600 border border-jewel-400/20">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => router.push("/me/edit")}
                      className="w-full text-left px-4 py-2.5 hover:bg-jewel-100 dark:hover:bg-jewel-800/50 text-sm text-jewel-700 dark:text-jewel-300 transition-colors"
                    >
                      Edit profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        router.push("/signin");
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-jewel-ruby/10 text-sm text-jewel-ruby transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl text-jewel-600 hover:text-jewel-gold hover:bg-jewel-100 dark:text-jewel-400 dark:hover:bg-jewel-800/50 transition-all"
          >
            {mobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-20 left-4 right-4 z-50 md:hidden
              bg-jewel-50/95 dark:bg-jewel-900/95 backdrop-blur-xl
              border border-jewel-400/20 dark:border-jewel-400/10
              rounded-2xl shadow-elevated overflow-hidden"
          >
            <div className="p-3 space-y-1">
              <MobileLink href="/" Icon={Home} label="Home" onClick={() => setMobileMenuOpen(false)} />
              <MobileLink href="/contact" Icon={Phone} label="Contact" onClick={() => setMobileMenuOpen(false)} />
              <MobileLink href="/search" Icon={Search} label="Search" onClick={() => setMobileMenuOpen(false)} />
            </div>

            {user && (
              <>
                <div className="h-px bg-jewel-400/20 dark:bg-jewel-400/10 mx-3" />
                <div className="p-3 space-y-1">
                  <MobileLink href="/family" Icon={Users} label="Family" onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/medical" Icon={Stethoscope} label="Medical" onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/resources" Icon={Package} label="Resources" onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/nearby" Icon={MapPin} label="Nearby" onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/events/calendar" Icon={Calendar} label="Calendar" onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/chat" Icon={MessageSquare} label="Chat" onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/notifications" Icon={BellPlus} label="Notifications" onClick={() => setMobileMenuOpen(false)} unreadCount={unreadCount} />
                </div>
                <div className="h-px bg-jewel-400/20 dark:bg-jewel-400/10 mx-3" />
                <div className="p-3">
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      router.push("/signin");
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-jewel-gold to-jewel-500 text-jewel-deep text-sm font-semibold
                      hover:shadow-lg hover:shadow-jewel-gold/25 transition-all"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}

            {!user && (
              <div className="p-3">
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-jewel-gold to-jewel-500 text-jewel-deep text-sm font-semibold text-center
                    hover:shadow-lg hover:shadow-jewel-gold/25 transition-all"
                >
                  Sign in
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Performs  mobile link operation.
 * @param {{ href: string; Icon: React.ComponentType<{ className?: string; }>; label: string; onClick: () => void; unreadCount?: number; }} {
 *   href,
 *   Icon,
 *   label,
 *   onClick,
 *   unreadCount,
 * } - Description of {
 *   href,
 *   Icon,
 *   label,
 *   onClick,
 *   unreadCount,
 * }
 * @returns {React.JSX.Element} Description of return value
 */
function MobileLink({
  href,
  Icon,
  label,
  onClick,
  unreadCount,
}: {
  href: string;
  Icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? "bg-jewel-gold/15 text-jewel-gold"
          : "text-jewel-700 dark:text-jewel-300 hover:bg-jewel-100 dark:hover:bg-jewel-800/50 hover:text-jewel-gold"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {unreadCount !== undefined && unreadCount > 0 && (
        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold text-jewel-50 bg-jewel-ruby rounded-full">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
