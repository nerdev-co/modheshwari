"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  MessageCircle,
  Search,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  UserCheck,
  Users2,
  GitBranch,
  Inbox,
  Activity,
  Bell,
} from "lucide-react";
import { MOTION_ENTER, MOTION_DRAWER } from "@repo/ui/motion";
import { useFocusTrap } from "@repo/ui/useFocusTrap";

import { SunMark } from "./SunMark";
import { LocaleToggle } from "./LocaleToggle";
import { useUser } from "../lib/UserContext";
import useNotifications from "../hooks/useNotifications";
import { useLocale } from "../lib/LocaleContext";

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  path: string;
  i18nKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "nav.sections.overview",
    items: [
      { path: "/", i18nKey: "nav.dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "nav.sections.community",
    items: [
      { path: "/families", i18nKey: "nav.families", icon: Users2 },
      { path: "/members", i18nKey: "nav.members", icon: UserCheck },
      { path: "/gotras", i18nKey: "nav.gotras", icon: GitBranch },
    ],
  },
  {
    label: "nav.sections.activity",
    items: [
      { path: "/events", i18nKey: "nav.events", icon: Calendar },
      { path: "/messages", i18nKey: "nav.messages", icon: MessageCircle },
    ],
  },
  {
    label: "nav.sections.personal",
    items: [
      { path: "/notifications", i18nKey: "nav.notifications", icon: Inbox },
      { path: "/activity", i18nKey: "nav.activity", icon: Activity },
    ],
  },
];

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED_WIDTH = 64;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: userLoading, logout } = useUser();
  const { unreadCount } = useNotifications();
  const { t } = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);

  useFocusTrap(sidebarRef, mobileSidebarOpen);
  useFocusTrap(profileButtonRef, profileMenuOpen);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.roles) return true;
      return user && item.roles.includes(user.role);
    }),
  })).filter((section) => section.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-saffron border-t-transparent" />
      </div>
    );
  }

  const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <div className="flex h-screen bg-canvas">
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className="hidden lg:flex lg:flex-col fixed lg:static inset-y-0 left-0 z-40 bg-surface border-r border-border transition-all duration-300 ease-out overflow-hidden"
        style={{ width: sidebarWidth }}
        aria-label="Main navigation"
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Modheshwari Home">
            <SunMark size={24} className="text-saffron flex-shrink-0" />
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={MOTION_ENTER}
                className="font-display-bold text-base text-ink tracking-tight"
              >
                Modheshwari
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5" aria-label="Main navigation">
          {filteredSections.map((section) => (
            <div key={section.label}>
              {sidebarOpen && (
                <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  {t(section.label)}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${
                        active
                          ? "bg-saffron-soft text-saffron"
                          : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {sidebarOpen && <span>{t(item.i18nKey)}</span>}
                      {!sidebarOpen && active && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-saffron" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - Profile */}
        <div className="p-2 border-t border-border">
          <Link
            to="/me"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
          >
            <User className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {sidebarOpen && <span>{t("nav.profile")}</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MOTION_ENTER}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            ref={mobileSidebarRef}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={MOTION_DRAWER}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex h-14 items-center justify-between px-4 border-b border-border">
              <Link to="/" className="flex items-center gap-2" aria-label="Modheshwari Home">
                <SunMark size={24} className="text-saffron" />
                <span className="font-display-bold text-base text-ink tracking-tight">Modheshwari</span>
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5" aria-label="Mobile navigation">
              {filteredSections.map((section) => (
                <div key={section.label}>
                  <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    {t(section.label)}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            active
                              ? "bg-saffron-soft text-saffron"
                              : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <span>{t(item.i18nKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-2 border-t border-border">
              <Link
                to="/me"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>{t("nav.profile")}</span>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className="flex flex-1 flex-col min-w-0"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarOpen ? 0 : SIDEBAR_COLLAPSED_WIDTH - SIDEBAR_WIDTH) : 0 }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-surface/80 backdrop-blur-xl border-b border-border">
          <div className="flex h-full items-center justify-between px-4 lg:px-5">
            {/* Left: Mobile menu + Sidebar toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-1.5 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Right: Search, Locale, Notifications, Profile */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder={t("common.searchPlaceholder")}
                    className="w-56 pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron transition-all"
                    aria-label={t("common.searchLabel")}
                  />
                </div>
              </div>

              <LocaleToggle />

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-1.5 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                aria-label={t("nav.notifications")}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[9px] font-bold text-ink-on-accent">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-muted transition-colors"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  aria-label={t("nav.account")}
                >
                  <div className="h-7 w-7 rounded-full bg-saffron-soft flex items-center justify-center">
                    <span className="text-xs font-semibold text-saffron">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={MOTION_ENTER}
                      className="absolute right-0 mt-1.5 w-52 origin-top-right rounded-xl bg-surface-raised border border-border shadow-medium p-1.5"
                      role="menu"
                    >
                      <div className="px-2.5 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
                        <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/me"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                        role="menuitem"
                      >
                        <User className="h-4 w-4" />
                        {t("nav.profile")}
                      </Link>
                      <Link
                        to="/me/edit"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4" />
                        {t("nav.settings")}
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-sm text-ruby hover:bg-ruby-soft transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
