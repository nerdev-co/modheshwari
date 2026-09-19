"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  MessageCircle,
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
  UserCheck,
  Users2,
  GitBranch,
  ClipboardList,
  CheckCheck,
  Compass,
  Inbox,
  Activity,
  Bell,
} from "lucide-react";
import { MOTION_ENTER, MOTION_SIDEBAR, MOTION_DRAWER } from "@repo/ui/motion";
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

const SIDEBAR_WIDTH = 272;
const SIDEBAR_COLLAPSED_WIDTH = 80;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: userLoading, logout } = useUser();
  const { unreadCount } = useNotifications();
  const { t } = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2" aria-label="Modheshwari Home">
            <SunMark size={28} className="text-saffron" />
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={MOTION_ENTER}
                className="font-display-bold text-xl text-ink"
              >
                Modheshwari
              </motion.span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5" aria-label="Main navigation">
          {filteredSections.map((section) => (
            <div key={section.label} className="space-y-1">
              {sidebarOpen && (
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={MOTION_ENTER}
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
                >
                  {t(section.label)}
                </motion.h3>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isHovered = hoveredItem === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => !sidebarOpen && setHoveredItem(item.path)}
                    onMouseLeave={() => !sidebarOpen && setHoveredItem(null)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-fast relative ${
                      active
                        ? "bg-saffron-soft text-saffron"
                        : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={MOTION_ENTER}
                      >
                        {t(item.i18nKey)}
                      </motion.span>
                    )}
                    {!sidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.9 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 150, ease: "easeOut" }}
                        className="absolute left-full ml-3 px-2 py-1 rounded-lg bg-ink text-ink-inverse text-xs font-medium whitespace-nowrap shadow-lg z-50"
                      >
                        {t(item.i18nKey)}
                      </motion.div>
                    )}
                    {active && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "calc(100% - 8px)" }}
                        exit={{ height: 0 }}
                        transition={MOTION_SIDEBAR}
                        className="absolute left-0 top-4 bottom-4 w-1 bg-saffron rounded-r-md"
                      />
                    )}
                    {!sidebarOpen && active && (
                      <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={MOTION_SIDEBAR}
                        className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-saffron"
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
            onMouseEnter={() => !sidebarOpen && setHoveredItem("profile")}
            onMouseLeave={() => !sidebarOpen && setHoveredItem(null)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:bg-surface-muted hover:text-ink transition-all duration-fast"
          >
            <User className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            {sidebarOpen && <span>{t("nav.profile")}</span>}
            {!sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: hoveredItem === "profile" ? 1 : 0, scale: hoveredItem === "profile" ? 1 : 0.9 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 150, ease: "easeOut" }}
                className="absolute left-full ml-3 px-2 py-1 rounded-lg bg-ink text-ink-inverse text-xs font-medium whitespace-nowrap shadow-lg z-50"
              >
                {t("nav.profile")}
              </motion.div>
            )}
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
            transition={MOTION_DRAWER}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-surface border-r border-border lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <Link to="/" className="flex items-center gap-2" aria-label="Modheshwari Home">
                <SunMark size={28} className="text-saffron" />
                <span className="font-display-bold text-xl text-ink">Modheshwari</span>
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Mobile navigation">
              {filteredSections.map((section) => (
                <div key={section.label} className="space-y-1">
                  <h3 className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
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
                            ? "bg-saffron-soft text-saffron"
                            : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:bg-surface-muted hover:text-ink transition-all duration-fast"
              >
                <User className="w-5 h-5" aria-hidden="true" />
                <span>{t("nav.profile")}</span>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-[272px]" style={{ marginLeft: sidebarOpen ? 0 : SIDEBAR_COLLAPSED_WIDTH - SIDEBAR_WIDTH }}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-1.5 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
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
                  className="text-sm font-medium text-ink-secondary hidden sm:block"
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
                  className="relative p-2 rounded-lg text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                  aria-label={t("nav.notifications")}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron text-[10px] font-semibold text-ink-on-accent">
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
                  className="flex items-center gap-2 p-1.5 rounded-xl text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  aria-label={t("nav.account")}
                >
                  <div className="h-8 w-8 rounded-full bg-saffron-soft flex items-center justify-center">
                    <span className="text-sm font-semibold text-saffron">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="hidden sm:block text-sm font-medium text-ink">
                        {user?.name || "User"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-ink-muted" />
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={MOTION_ENTER}
                      className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-surface-raised border border-border shadow-medium p-2"
                      role="menu"
                    >
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-medium text-ink">{user?.name}</p>
                        <p className="text-xs text-ink-muted">{user?.email}</p>
                        <span className="inline-flex mt-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-saffron-soft text-saffron">
                          {t(`role.${user?.role?.toLowerCase() || "member"}`)}
                        </span>
                      </div>
                      <Link
                        to="/me"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4" />
                        {t("nav.profile")}
                      </Link>
                      <Link
                        to="/me/edit"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-secondary hover:bg-surface-muted hover:text-ink transition-colors"
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4" />
                        {t("nav.settings")}
                      </Link>
                      <hr className="my-2 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-ruby hover:bg-ruby-soft transition-colors"
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