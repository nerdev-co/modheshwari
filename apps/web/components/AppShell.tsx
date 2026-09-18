"use client";
import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  MessageCircle,
  HeartPulse,
  Map,
  Bell,
  Package,
  Search,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  HelpCircle,
  UserCheck,
  Users2,
  GitBranch,
  ClipboardList,
  CheckCheck,
  Truck,
  Compass,
  Inbox,
  Activity,
} from "lucide-react";

import { MOTION_ENTER } from "@repo/ui/motion";
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
      { path: "/dashboard", i18nKey: "nav.dashboard", icon: LayoutDashboard },
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
    label: "nav.sections.operations",
    items: [
      { path: "/requests", i18nKey: "nav.requests", icon: ClipboardList },
      { path: "/approvals", i18nKey: "nav.approvals", icon: CheckCheck },
      { path: "/resources", i18nKey: "nav.resources", icon: Package },
    ],
  },
  {
    label: "nav.sections.discover",
    items: [
      { path: "/search", i18nKey: "nav.search", icon: Search },
      { path: "/nearby", i18nKey: "nav.nearby", icon: Compass },
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
const SIDEBAR_COLLAPSED_WIDTH = 72;

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

  // Close mobile sidebar on route change
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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <div className="flex h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className="hidden lg:flex lg:flex-col fixed lg:static inset-y-0 left-0 z-40 bg-surface-raised border-r border-border transition-all duration-300 ease-out overflow-hidden"
        style={{ width: sidebarWidth }}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2" aria-label="Modheshwari Home">
            <SunMark size={28} className="text-accent" />
            {sidebarOpen && (
              <span className="font-display font-semibold text-xl text-text-primary">Modheshwari</span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4" aria-label="Main navigation">
          {filteredSections.map((section) => (
            <div key={section.label} className="space-y-1">
              {sidebarOpen && (
                <h3 className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {t(section.label)}
                </h3>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-fast ${
                      active
                        ? "bg-accent-muted text-accent"
                        : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                    } relative`}
                    aria-current={active ? "page" : undefined}
                    title={sidebarOpen ? undefined : t(item.i18nKey)}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    {sidebarOpen && <span>{t(item.i18nKey)}</span>}
                    {active && sidebarOpen && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 3 }}
                        exit={{ width: 0 }}
                        transition={MOTION_ENTER}
                        className="absolute left-0 top-1 bottom-1 bg-accent rounded-r-md"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={`p-3 border-t border-border transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <Link
            to="/me"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-all duration-fast"
            title={sidebarOpen ? undefined : t("nav.profile")}
          >
            <User className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
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

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            ref={mobileSidebarRef}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={MOTION_ENTER}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-raised border-r border-border lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <Link to="/" className="flex items-center gap-2" aria-label="Modheshwari Home">
                <SunMark size={28} className="text-accent" />
                <span className="font-display font-semibold text-xl text-text-primary">Modheshwari</span>
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4" aria-label="Mobile navigation">
              {filteredSections.map((section) => (
                <div key={section.label} className="space-y-1">
                  <h3 className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {t(section.label)}
                  </h3>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-fast ${
                          active
                            ? "bg-accent-muted text-accent"
                            : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                        <span>{t(item.i18nKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-border">
              <Link
                to="/me"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-all duration-fast"
              >
                <User className="w-5 h-5" aria-hidden="true" />
                <span>{t("nav.profile")}</span>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-[256px]" style={{ marginLeft: sidebarOpen ? 0 : SIDEBAR_COLLAPSED_WIDTH - SIDEBAR_WIDTH }}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-1.5 rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={MOTION_ENTER}
                  className="text-sm font-medium text-text-secondary hidden sm:block"
                >
                  {(() => {
                    const activeSection = filteredSections.find((s) =>
                      s.items.some((item) => isActive(item.path))
                    );
                    return activeSection ? t(activeSection.label) : "";
                  })()}
                </motion.span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <LocaleToggle />

              {/* Notifications */}
              <div className="relative">
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                  aria-label={t("nav.notifications")}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ruby-500 text-[10px] font-semibold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  aria-label={t("nav.account")}
                >
                  <div className="h-8 w-8 rounded-full bg-accent-muted flex items-center justify-center">
                    <span className="text-sm font-semibold text-accent">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="hidden sm:block text-sm font-medium text-text-primary">
                        {user?.name || "User"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={MOTION_ENTER}
                      className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-surface-raised border border-border shadow-medium p-2"
                      role="menu"
                    >
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                        <p className="text-xs text-text-muted">{user?.email}</p>
                        <span className="inline-flex mt-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-accent-muted text-accent">
                          {t(`role.${user?.role?.toLowerCase() || "member"}`)}
                        </span>
                      </div>
                      <Link
                        to="/me"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4" />
                        {t("nav.profile")}
                      </Link>
                      <Link
                        to="/me/edit"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4" />
                        {t("nav.settings")}
                      </Link>
                      <hr className="my-2 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-ruby-600 hover:bg-ruby-50 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" />
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}