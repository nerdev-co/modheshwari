"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { LoadingState } from "@repo/ui/loadingState";
import { motion } from "framer-motion";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import apiFetch from "../../../lib/api";
import { API_BASE } from "../../../lib/config";
import { useUser } from "../../../lib/UserContext";
import { useLocale } from "../../../lib/LocaleContext";

type EventItem = {
    id: string;
    name: string;
    date: string;
    venue?: string;
    status: string;
    createdAt?: string;
};

/**
 * @param {Date} d - Description of d
 */
function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * @param {Date} d - Description of d
 */
function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Performs  events calendar operation.
 * @returns {any} Description of return value
 */
export default function EventsCalendar() {
    const { t } = useLocale();
    const { user, loading: authLoading } = useUser();
    const [current, setCurrent] = useState(() => startOfMonth(new Date()));
    const [events, setEvents] = useState<EventItem[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);

    const base = API_BASE;
    const navigate = useNavigate();

    const lastItemsRef = React.useRef<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) navigate("/signin");
    }, [user, authLoading, navigate]);

    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLoading(true);
            try {
                const ms = startOfMonth(current);
                const me = endOfMonth(current);
                const start = ms.toISOString();
                me.setHours(23, 59, 59, 999);
                const json = await apiFetch(
                    `${base}/events?status=APPROVED&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(
                        me.toISOString(),
                    )}&limit=500`,
                    { throwOnError: false, signal: controller.signal },
                );
                let items: EventItem[] = [];
                if (json == null) {
                    items = [];
                } else if (Array.isArray(json)) {
                    items = json;
                } else if (Array.isArray(json.data)) {
                    items = json.data;
                } else if (json.data && Array.isArray(json.data.data)) {
                    items = json.data.data;
                } else if (json.ok === false && json.data) {
                    items = Array.isArray(json.data)
                        ? json.data
                        : Array.isArray(json.data.data)
                          ? json.data.data
                          : [];
                } else {
                    items = [];
                }

                try {
                    const ids = Array.isArray(items)
                        ? items.map(
                              (it: EventItem) => it?.id ?? JSON.stringify(it),
                          )
                        : [];
                    const hash = JSON.stringify(ids);
                    if (lastItemsRef.current !== hash) {
                        setEvents(items);
                        lastItemsRef.current = hash;
                    }
                } catch {
                    setEvents(items);
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError")
                    return;
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
        return () => controller.abort();
    }, [base, current]);

    if (authLoading)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingState message={t("events.calendar.loading")} />
            </div>
        );
    if (!user) return null;

    const firstDayIndex = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();

    const days: Array<{ date: Date; inMonth: boolean }> = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = new Date(monthStart);
        d.setDate(d.getDate() - (i + 1));
        days.push({ date: d, inMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
        days.push({
            date: new Date(current.getFullYear(), current.getMonth(), d),
            inMonth: true,
        });
    }

    while (days.length % 7 !== 0) {
        const lastDay = days.at(-1);
        if (!lastDay) break;

        const nd = new Date(lastDay.date);
        nd.setDate(nd.getDate() + 1);
        days.push({ date: nd, inMonth: false });
    }

    const eventsByDay = new Map<string, EventItem[]>();
    events.forEach((ev: EventItem) => {
        try {
            const dateStr = ev.date || ev.createdAt;
            if (!dateStr) return;
            const d = new Date(dateStr).toISOString().slice(0, 10);
            const arr = eventsByDay.get(d) || [];
            arr.push(ev);
            eventsByDay.set(d, arr);
        } catch {
            // skip invalid dates
        }
    });

    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION_PAGE_ENTER} className="mb-14">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <CalIcon className="w-5 h-5 text-saffron" />
                            <div>
                                <h1 className="font-display text-display font-semibold leading-tight text-ink">{t("events.calendar.title")}</h1>
                                <p className="text-body-lg text-ink-secondary mt-1">{t("events.calendar.description")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-body font-medium text-ink px-3">
                                {current.toLocaleString(undefined, { month: "long", year: "numeric" })}
                            </span>
                            <Button variant="secondary" size="sm" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <div className="h-px bg-border" />

                <div className="py-10">
                    <div className="lg:flex lg:gap-8">
                        <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-7 gap-1 text-caption font-semibold uppercase tracking-wider text-ink-muted mb-3">
                                {dayKeys.map((d) => (
                                    <div key={d} className="text-center py-2">{t(`events.calendar.${d}`)}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {days.map((dayObj, idx) => {
                                    const key = dayObj.date.toISOString().slice(0, 10);
                                    const dayEvents = eventsByDay.get(key) || [];
                                    const isSelected = selectedDate && selectedDate.toISOString().slice(0, 10) === key;
                                    const todayKey = new Date().toISOString().slice(0, 10);
                                    const isToday = key === todayKey;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedDate(new Date(dayObj.date))}
                                            className={`relative text-left p-2 min-h-[80px] border transition ${
                                                dayObj.inMonth ? "border-border-subtle hover:bg-surface" : "border-transparent"
                                            } ${isSelected ? "ring-1 ring-saffron border-saffron" : ""}`}
                                        >
                                            <div className="flex justify-end mb-1">
                                                <span className={`text-body font-medium ${isToday ? "text-saffron" : dayObj.inMonth ? "text-ink" : "text-ink-muted"}`}>
                                                    {dayObj.date.getDate()}
                                                </span>
                                            </div>
                                            {dayEvents.length > 0 && (
                                                <div className="text-caption text-saffron font-medium">{dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}</div>
                                            )}
                                            {dayEvents.slice(0, 1).map((ev: EventItem) => (
                                                <div key={ev.id} onClick={(e) => { e.stopPropagation(); navigate(`/events/${ev.id}`); }} title={ev.name}
                                                    className="text-caption text-ink truncate mt-0.5 hover:text-saffron cursor-pointer">{ev.name}</div>
                                            ))}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <aside className="mt-6 lg:mt-0 lg:w-72 lg:flex-shrink-0">
                            <div className="border border-border p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-body font-semibold text-ink">
                                        {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : t("events.calendar.upcomingEvents")}
                                    </h3>
                                    <button onClick={() => navigate("/events")} className="text-caption text-saffron hover:text-ink transition-colors">{t("events.calendar.viewAll")}</button>
                                </div>
                                <div className="space-y-3 max-h-[60vh] overflow-auto">
                                    {(selectedDate ? eventsByDay.get(selectedDate.toISOString().slice(0, 10)) || [] : events.slice(0, 50)).map((ev) => (
                                        <div key={ev.id} className="py-3 border-b border-border-subtle last:border-0">
                                            <p className="text-body font-medium text-ink">{ev.name}</p>
                                            <p className="text-caption text-ink-muted">{new Date(ev.date).toLocaleString()}</p>
                                            {ev.venue && <p className="text-caption text-ink-muted">{ev.venue}</p>}
                                        </div>
                                    ))}
                                    {selectedDate && (eventsByDay.get(selectedDate.toISOString().slice(0, 10)) || []).length === 0 && (
                                        <p className="text-body text-ink-muted">{t("events.calendar.noEventsOnDay")}</p>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>

                    {loading && (
                        <div className="mt-4">
                            <LoadingState message={t("events.calendar.loadingEvents")} size="sm" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
