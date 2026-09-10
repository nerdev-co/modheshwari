"use client";

import { useState, useEffect, useRef, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  Home,
  Users,
  Package,
  Bell,
  Phone,
  MapPin,
  Calendar,
  MessageCircle,
  Stethoscope,
} from "lucide-react";
import { MOTION_ENTER, MOTION_EXIT } from "@repo/ui/motion";
import { useFocusTrap } from "@repo/ui/useFocusTrap";

import { useUser } from "../lib/UserContext";
import { ROLE_COLORS, ROLE_COLORS_CSS } from "../lib/constants";
import Tooltip from "./Tooltip";
import useNotifications from "../hooks/useNotifications";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleToggle } from "./LocaleToggle";
import { useLocale } from "../lib/LocaleContext";

export default function NavBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const { unreadCount } = useNotifications();
  const { t } = useLocale();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileMenuOpen(false);
        profileButtonRef.current?.focus();
        return;
      }
      if (!profileMenuRef.current) return;
      const menuItems = Array.from(
        profileMenuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
      );
      if (menuItems.length === 0) return;
      const currentIndex = menuItems.indexOf(document.activeElement as HTMLElement);

      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          const prev = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
          menuItems[prev]?.focus();
        } else {
          const next = currentIndex >= menuItems.length - 1 ? 0 : currentIndex + 1;
          menuItems[next]?.focus();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = currentIndex >= menuItems.length - 1 ? 0 : currentIndex + 1;
        menuItems[next]?.focus();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
        menuItems[prev]?.focus();
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        menuItems[0]?.focus();
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        menuItems[menuItems.length - 1]?.focus();
      }
    };
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      const firstItem = profileMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      firstItem?.focus();
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  useFocusTrap(profileMenuRef, profileMenuOpen, {
    onClose: () => setProfileMenuOpen(false),
    returnFocus: profileButtonRef,
  });

  useFocusTrap(mobileMenuRef, mobileMenuOpen, {
    onClose: () => setMobileMenuOpen(false),
    returnFocus: mobileMenuButtonRef,
  });

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
    <Link to={href} aria-label={title} aria-current={isActive(href) ? "page" : undefined}>
      <Tooltip text={title}>
        <div
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all duration-fast ${
            isActive(href)
              ? "bg-accent-muted text-accent"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
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

  return (
    <>
      <div className="h-[60px]" />

      <motion.nav
        aria-label="Main navigation"
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={MOTION_ENTER}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center h-12
          rounded-2xl border border-border
          bg-surface/80 backdrop-blur-xl
          shadow-soft
          px-2"
      >
        <Link to="/" aria-label="Modheshwari home" className="flex items-center gap-2 pl-3 pr-2 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center text-jewel-900 text-xs font-bold">
            M
          </div>
          <span className="hidden sm:block text-text-primary font-semibold text-sm">
            Modheshwari
          </span>
        </Link>

        <div className="h-5 w-px bg-border mx-1" />

        {!loading && (
          <div className="hidden md:flex items-center gap-0.5">
            <NavIcon href="/" Icon={Home} title={t("nav.home")} />
            <NavIcon href="/contact" Icon={Phone} title={t("nav.contact")} />
            <NavIcon href="/search" Icon={Search} title={t("nav.search")} />

            {user && (
              <>
                <NavIcon href="/family" Icon={Users} title={t("nav.family")} />
                <NavIcon href="/medical" Icon={Stethoscope} title={t("nav.medical")} />
                <NavIcon href="/resources" Icon={Package} title={t("nav.resources")} />
                <NavIcon href="/nearby" Icon={MapPin} title={t("nav.nearby")} />
                <NavIcon href="/events/calendar" Icon={Calendar} title={t("nav.calendar")} />
                <NavIcon href="/notifications" Icon={Bell} title={t("nav.notifications")} />
                <NavIcon href="/chat" Icon={MessageCircle} title={t("nav.chat")} />
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 ml-1">
          <LocaleToggle />
          <ThemeToggle />

          {!loading && !user && (
            <Link
              to="/signin"
              className="px-4 py-1.5 rounded-xl bg-accent text-jewel-900 text-xs font-semibold
                hover:bg-accent-hover transition-all duration-fast active:scale-[0.98]"
            >
              {t("nav.signIn")}
            </Link>
          )}

          {!loading && user && (
            <>
              <Link
                to="/notifications"
                aria-label={t("nav.notifications")}
                className="md:hidden relative p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-ruby-500" />
                  </span>
                )}
              </Link>

              <div className="relative" ref={profileMenuRef}>
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setProfileMenuOpen(true);
                    }
                  }}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  aria-label={t("nav.profile")}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-jewel-900
                    hover:scale-[1.05] transition-transform duration-fast"
                  style={{ background: ROLE_COLORS_CSS[user.role] || "var(--jewel-400)" }}
                >
                  {initials}
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 mt-3 w-52
                      bg-surface border border-border
                      rounded-2xl shadow-elevated z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <div className="font-medium text-sm text-text-primary">
                        {user.name}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold text-jewel-900 ${ROLE_COLORS[user.role] || "bg-jewel-400"}`}>
                          {user.role ? user.role.replace(/_/g, " ") : "Unknown"}
                        </span>
                        {user.status ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-jewel-emerald/10 text-jewel-emerald border border-jewel-emerald/20">
                            {t("common.active")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-surface-muted text-text-muted border border-border">
                            {t("common.inactive")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate("/me/edit");
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-muted text-sm text-text-secondary transition-colors"
                      >
                        {t("nav.editProfile")}
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                          navigate("/signin");
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-ruby-50 text-sm text-ruby-500 transition-colors"
                      >
                        {t("nav.signOut")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            ref={mobileMenuButtonRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            className="md:hidden p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all"
          >
            {mobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && !loading && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MOTION_EXIT}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              aria-hidden="true"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              id="mobile-menu"
              ref={mobileMenuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={MOTION_ENTER}
            className="fixed top-18 left-3 right-3 z-50 md:hidden
              bg-surface border border-border
              rounded-2xl shadow-elevated overflow-hidden"
          >
            <div className="p-3 space-y-1">
              <MobileLink href="/" Icon={Home} label={t("nav.home")} onClick={() => setMobileMenuOpen(false)} />
              <MobileLink href="/contact" Icon={Phone} label={t("nav.contact")} onClick={() => setMobileMenuOpen(false)} />
              <MobileLink href="/search" Icon={Search} label={t("nav.search")} onClick={() => setMobileMenuOpen(false)} />
            </div>

            {user && (
              <>
                <div className="h-px bg-border mx-3" />
                <div className="p-3 space-y-1">
                  <MobileLink href="/family" Icon={Users} label={t("nav.family")} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/medical" Icon={Stethoscope} label={t("nav.medical")} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/resources" Icon={Package} label={t("nav.resources")} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/nearby" Icon={MapPin} label={t("nav.nearby")} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/events/calendar" Icon={Calendar} label={t("nav.calendar")} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/chat" Icon={MessageCircle} label={t("nav.chat")} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink href="/notifications" Icon={Bell} label={t("nav.notifications")} onClick={() => setMobileMenuOpen(false)} unreadCount={unreadCount} />
                </div>
                <div className="h-px bg-border mx-3" />
                <div className="p-3">
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate("/signin");
                    }}
                    className="w-full py-2.5 rounded-xl bg-surface-muted text-text-secondary text-sm font-medium
                      hover:bg-ruby-50 hover:text-ruby-500 transition-all active:scale-[0.98]"
                  >
                    {t("nav.signOut")}
                  </button>
                </div>
              </>
            )}

            {!user && (
              <div className="p-3">
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 rounded-xl bg-accent text-jewel-900 text-sm font-semibold text-center
                    hover:bg-accent-hover transition-all active:scale-[0.98]"
                >
                  {t("nav.signIn")}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </>
  );
}

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
  const { pathname } = useLocation();
  const isActive = pathname === href;

  return (
    <Link
      to={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-fast ${
        isActive
          ? "bg-accent-muted text-accent"
          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {unreadCount !== undefined && unreadCount > 0 && (
        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold text-white bg-ruby-500 rounded-full">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
