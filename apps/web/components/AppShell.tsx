"use client";

import { ReactNode, useState, useRef, useEffect, useMemo } from "react";
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
    Bell,
} from "lucide-react";
import { MOTION_ENTER, MOTION_DRAWER } from "@repo/ui/motion";
import { useFocusTrap } from "@repo/ui/useFocusTrap";

import { SunMark } from "./SunMark";
import { LocaleToggle } from "./LocaleToggle";
import { useUser } from "../lib/UserContext";
import useNotifications from "../hooks/useNotifications";
import { useLocale } from "../lib/LocaleContext";
import Tooltip from "./Tooltip";

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
        items: [{ path: "/", i18nKey: "nav.dashboard", icon: LayoutDashboard }],
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
            {
                path: "/notifications",
                i18nKey: "nav.notifications",
                icon: Inbox,
            },
        ],
    },
];

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED_WIDTH = 64;

const routeLabels: Record<string, string> = {
    "/": "nav.dashboard",
    "/families": "nav.families",
    "/members": "nav.members",
    "/gotras": "nav.gotras",
    "/events": "nav.events",
    "/events/calendar": "nav.calendar",
    "/events/create": "events.create.title",
    "/messages": "nav.messages",
    "/chat": "chat.title",
    "/notifications": "nav.notifications",
    "/search": "search.title",
    "/nearby": "nearby.title",
    "/resources": "resources.title",
    "/medical": "medical.title",
    "/medical/records": "medical.records.title",
    "/family": "family.title",
    "/family/tree": "family.tree.title",
    "/me": "nav.profile",
    "/me/edit": "edit.title",
    "/settings": "nav.settings",
};

/**
 * Performs  app shell operation.
 * @param {{ children: React.ReactNode; }} { children } - Description of { children }
 * @returns {React.JSX.Element} Description of return value
 */
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

    const filteredSections = useMemo(() => NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => {
            if (!item.roles) return true;
            return user && item.roles.includes(user.role);
        }),
    })).filter((section) => section.items.length > 0), [user?.role]);

    const breadcrumbs = useMemo(() => {
        const pathname = location.pathname;
        if (pathname === "/") return [{ label: t("nav.dashboard"), href: "/" }];

        const segments = pathname.split("/").filter(Boolean);
        const crumbs = [{ label: t("nav.dashboard"), href: "/" }];

        let currentPath = "";
        for (const segment of segments) {
            currentPath += `/${segment}`;
            const labelKey = routeLabels[currentPath] || segment;
            crumbs.push({ label: t(labelKey), href: currentPath });
        }
        return crumbs;
    }, [location.pathname, t]);

    const handleLogout = () => {
        logout();
        navigate("/signin");
    };

    if (userLoading) {
        return (
            <div className="bg-canvas flex h-screen items-center justify-center">
                <div className="border-saffron h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
        );
    }

    const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

    return (
        <div className="bg-canvas flex h-screen">
            {/* Desktop Sidebar */}
            <aside
                ref={sidebarRef}
                className="bg-surface border-border fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r transition-all duration-300 ease-out lg:static lg:flex lg:flex-col"
                style={{ width: sidebarWidth }}
                aria-label="Main navigation"
            >
                {/* Sidebar Header */}
                <div className="border-border flex h-14 items-center border-b px-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2.5"
                        aria-label="Modheshwari Home"
                    >
                        <SunMark
                            size={24}
                            className="text-saffron flex-shrink-0"
                        />
                        {sidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={MOTION_ENTER}
                                className="text-ink font-display-bold text-base tracking-tight"
                            >
                                Modheshwari
                            </motion.span>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav
                    className="flex-1 space-y-5 overflow-y-auto px-2 py-3"
                    aria-label="Main navigation"
                >
                    {filteredSections.map((section) => (
                        <div key={section.label}>
                            {sidebarOpen && (
                                <p className="text-ink-muted mb-1.5 px-2 text-[10px] font-semibold tracking-wider uppercase">
                                    {t(section.label)}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    const label = t(item.i18nKey);
                                    return (
                                        <Tooltip text={label} key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${
                                                    active
                                                        ? "text-saffron font-semibold"
                                                        : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
                                                }`}
                                                aria-current={active ? "page" : undefined}
                                                aria-label={sidebarOpen ? undefined : label}
                                            >
                                                <Icon
                                                    className="h-4 w-4 flex-shrink-0"
                                                    aria-hidden="true"
                                                />
                                                {sidebarOpen && (
                                                    <span>{label}</span>
                                                )}
                                                {active && (
                                                    <span
                                                        className={`
                                                            absolute top-1/2 -translate-y-1/2 rounded-full bg-saffron
                                                            ${
                                                                sidebarOpen
                                                                    ? "right-2 h-1.5 w-1.5"
                                                                    : "left-full ml-2 h-2 w-2"
                                                            }
                                                        `}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </Link>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer - Profile */}
                <div className="border-border border-t p-2">
                    <Tooltip text={t("nav.profile")}>
                        <Link
                            to="/me"
                            className="text-ink-secondary hover:bg-surface-muted hover:text-ink flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors"
                            aria-label={sidebarOpen ? undefined : t("nav.profile")}
                        >
                            <User
                                className="h-4 w-4 flex-shrink-0"
                                aria-hidden="true"
                            />
                            {sidebarOpen && <span>{t("nav.profile")}</span>}
                        </Link>
                    </Tooltip>
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
                        className="bg-surface border-border fixed inset-y-0 left-0 z-50 w-72 border-r lg:hidden"
                        aria-label="Mobile navigation"
                    >
                        <div className="border-border flex h-14 items-center justify-between border-b px-4">
                            <Link
                                to="/"
                                className="flex items-center gap-2"
                                aria-label="Modheshwari Home"
                            >
                                <SunMark size={24} className="text-saffron" />
                                <span className="text-ink font-display-bold text-base tracking-tight">
                                    Modheshwari
                                </span>
                            </Link>
                            <button
                                onClick={() => setMobileSidebarOpen(false)}
                                className="text-ink-secondary hover:bg-surface-muted hover:text-ink rounded-lg p-1.5 transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <nav
                            className="flex-1 space-y-5 overflow-y-auto px-2 py-3"
                            aria-label="Mobile navigation"
                        >
                            {filteredSections.map((section) => (
                                <div key={section.label}>
                                    <p className="text-ink-muted mb-1.5 px-2 text-[10px] font-semibold tracking-wider uppercase">
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
                                                    onClick={() =>
                                                        setMobileSidebarOpen(false)
                                                    }
                                                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                        active
                                                            ? "text-saffron font-semibold"
                                                            : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
                                                    }`}
                                                    aria-current={
                                                        active
                                                            ? "page"
                                                            : undefined
                                                    }
                                                >
                                                    <Icon
                                                        className="h-4 w-4 flex-shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    <span>
                                                        {t(item.i18nKey)}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        <div className="border-border border-t p-2">
                            <Link
                                to="/me"
                                onClick={() => setMobileSidebarOpen(false)}
                                className="text-ink-secondary hover:bg-surface-muted hover:text-ink flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors"
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
                className="flex min-w-0 flex-1 flex-col"
                style={{
                    marginLeft:
                        typeof window !== "undefined" &&
                        window.innerWidth >= 1024
                            ? sidebarOpen
                                ? 0
                                : SIDEBAR_COLLAPSED_WIDTH - SIDEBAR_WIDTH
                            : 0,
                }}
            >
                {/* Top Bar */}
                <header className="bg-surface/80 border-border sticky top-0 z-30 h-14 border-b backdrop-blur-xl">
                    <div className="flex h-full items-center justify-between px-4 lg:px-5">
                        {/* Left: Mobile menu + Sidebar toggle + Breadcrumbs */}
                        <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="text-ink-secondary hover:bg-surface-muted hover:text-ink rounded-lg p-1.5 transition-colors lg:hidden"
                                aria-label="Open menu"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="text-ink-secondary hover:bg-surface-muted hover:text-ink hidden rounded-lg p-1.5 transition-colors lg:flex"
                                aria-label={
                                    sidebarOpen
                                        ? "Collapse sidebar"
                                        : "Expand sidebar"
                                }
                                aria-expanded={sidebarOpen}
                            >
                                {sidebarOpen ? (
                                    <ChevronLeft className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>

                            {/* Breadcrumbs */}
                            <nav
                                className="hidden lg:flex items-center gap-1.5 text-sm"
                                aria-label="Breadcrumb"
                            >
                                {breadcrumbs.map((crumb, index) => (
                                    <span key={crumb.href} className="flex items-center gap-1.5">
                                        {index > 0 && (
                                            <ChevronRight
                                                className="h-3 w-3 text-ink-muted flex-shrink-0"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {index === breadcrumbs.length - 1 ? (
                                            <span className="text-ink font-medium truncate max-w-[200px]">
                                                {crumb.label}
                                            </span>
                                        ) : (
                                            <Link
                                                to={crumb.href}
                                                className="text-ink-muted hover:text-ink transition-colors truncate max-w-[150px]"
                                            >
                                                {crumb.label}
                                            </Link>
                                        )}
                                    </span>
                                ))}
                            </nav>
                        </div>

                        {/* Right: Global Search, Locale, Notifications, Profile */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            {/* Global Search */}
                            <div className="relative hidden sm:block">
                                <Search
                                    className="text-ink-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    placeholder={t("common.searchPlaceholder")}
                                    className="border-border bg-canvas text-ink placeholder:text-ink-muted focus:ring-saffron focus:border-saffron w-64 sm:w-72 rounded-lg border py-1.5 pr-3 pl-10 text-sm transition-all focus:ring-1 focus:outline-none"
                                    aria-label={t("common.searchLabel")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            navigate(`/search?q=${encodeURIComponent(e.currentTarget.value)}`);
                                        }
                                    }}
                                />
                            </div>

                            <LocaleToggle />

                            {/* Notifications */}
                            <Link
                                to="/notifications"
                                className="text-ink-secondary hover:bg-surface-muted hover:text-ink relative rounded-lg p-1.5 transition-colors"
                                aria-label={t("nav.notifications")}
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="bg-saffron text-ink-on-accent absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </Link>

                            {/* Profile Menu */}
                            <div className="relative">
                                <button
                                    ref={profileButtonRef}
                                    onClick={() =>
                                        setProfileMenuOpen(!profileMenuOpen)
                                    }
                                    className="hover:bg-surface-muted flex items-center gap-2 rounded-lg p-1 transition-colors"
                                    aria-expanded={profileMenuOpen}
                                    aria-haspopup="true"
                                    aria-label={t("nav.account")}
                                >
                                    <div className="bg-saffron-soft flex h-7 w-7 items-center justify-center rounded-full">
                                        <span className="text-saffron text-xs font-semibold">
                                            {user?.name
                                                ?.charAt(0)
                                                .toUpperCase() || "U"}
                                        </span>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {profileMenuOpen && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: -4,
                                                scale: 0.98,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -4,
                                                scale: 0.98,
                                            }}
                                            transition={MOTION_ENTER}
                                            className="bg-surface-raised border-border shadow-medium absolute right-0 mt-1.5 w-52 origin-top-right rounded-xl border p-1.5"
                                            role="menu"
                                        >
                                            <div className="border-border mb-1 border-b px-2.5 py-2">
                                                <p className="text-ink truncate text-sm font-medium">
                                                    {user?.name || t("profile.unnamedMember")}
                                                </p>
                                                <p className="text-ink-muted truncate text-xs">
                                                    {user?.email}
                                                </p>
                                            </div>
                                            <Link
                                                to="/me"
                                                onClick={() =>
                                                    setProfileMenuOpen(false)
                                                }
                                                className="text-ink-secondary hover:bg-surface-muted hover:text-ink flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
                                                role="menuitem"
                                            >
                                                <User className="h-4 w-4" />
                                                {t("nav.profile")}
                                            </Link>
                                            <Link
                                                to="/me/edit"
                                                onClick={() =>
                                                    setProfileMenuOpen(false)
                                                }
                                                className="text-ink-secondary hover:bg-surface-muted hover:text-ink flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
                                                role="menuitem"
                                            >
                                                <Settings className="h-4 w-4" />
                                                {t("nav.settings")}
                                            </Link>
                                            <hr className="border-border my-1" />
                                            <button
                                                onClick={handleLogout}
                                                className="text-ruby hover:bg-ruby-soft flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
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
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}