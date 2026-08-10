"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

import apiFetch from "../../../lib/api";
import { API_BASE } from "../../../lib/config";

type EventItem = {
  id: string;
  name: string;
  date: string;
  venue?: string;
  status: string;
  createdAt?: string;
};

/**
 * Performs start of month operation.
 * @param {Date} d - Description of d
 * @returns {Date} Description of return value
 */
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Performs end of month operation.
 * @param {Date} d - Description of d
 * @returns {Date} Description of return value
 */
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Performs  events calendar operation.
 * @returns {any} Description of return value
 */
export default function EventsCalendar() {
  const [current, setCurrent] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const base = API_BASE;
  const router = useRouter();

  const lastItemsRef = React.useRef<string | null>(null);

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
            ? items.map((it: EventItem) => it?.id ?? JSON.stringify(it))
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
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [base, current]);

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

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <CalIcon className="w-6 h-6 text-jewel-gold" />
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-jewel-900">
                  Events Calendar
                </h1>
                <p className="text-sm text-jewel-500">
                  Browse upcoming community events by date
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                aria-label="Previous month"
                onClick={() =>
                  setCurrent(
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
                className="p-2 bg-jewel-50/50 border border-jewel-400/30 rounded-xl hover:bg-jewel-100 transition"
              >
                <ChevronLeft className="w-5 h-5 text-jewel-900" />
              </Button>

              <div className="px-4 py-2 bg-jewel-50/50 border border-jewel-400/30 rounded-xl font-medium text-jewel-900">
                {current.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                aria-label="Next month"
                onClick={() =>
                  setCurrent(
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
                className="p-2 bg-jewel-50/50 border border-jewel-400/30 rounded-xl hover:bg-jewel-100 transition"
              >
                <ChevronRight className="w-5 h-5 text-jewel-900" />
              </Button>
            </div>
          </div>

          <div className="lg:flex lg:gap-6">
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-7 gap-2 text-xs font-semibold tracking-wide text-jewel-500 mb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 auto-rows-[92px]">
                {days.map((dayObj, idx) => {
                  const key = dayObj.date.toISOString().slice(0, 10);
                  const dayEvents = eventsByDay.get(key) || [];
                  const isSelected = selectedDate && selectedDate.toISOString().slice(0, 10) === key;
                  const todayKey = new Date().toISOString().slice(0, 10);
                  const isToday = key === todayKey;

                  return (
                    <Button
                      key={idx}
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setSelectedDate(new Date(dayObj.date))}
                      className={`relative w-full h-full text-left rounded-xl border transition
                        ${
                          dayObj.inMonth
                            ? "bg-jewel-50/50 border-jewel-400/20 hover:bg-jewel-100/60 hover:shadow-sm flex flex-col"
                            : "bg-jewel-50/30 border-jewel-400/10 text-jewel-400"
                        }
                        ${isSelected ? "ring-2 ring-jewel-gold/40 border-jewel-gold/30 bg-jewel-gold/5" : ""}
                      `}
                    >
                      <div className="absolute top-2 right-2">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold
                            ${
                              isToday
                                ? "bg-jewel-gold text-jewel-deep"
                                : dayObj.inMonth
                                  ? "text-jewel-900"
                                  : "text-jewel-400"
                            }
                          `}
                        >
                          {dayObj.date.getDate()}
                        </div>
                      </div>

                      {dayEvents.length > 0 && (
                        <div className="absolute top-2 left-2">
                          <div className="text-[11px] px-2 py-0.5 rounded-full bg-jewel-gold/15 text-jewel-gold border border-jewel-gold/25">
                            {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                          </div>
                        </div>
                      )}

                      <div className="absolute left-2 right-2 bottom-2 space-y-1">
                        {dayEvents.slice(0, 1).map((ev: EventItem) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/events/${ev.id}`);
                            }}
                            title={ev.name}
                            className="text-xs px-2 py-1 rounded-md bg-jewel-50/80 border border-jewel-400/20 text-jewel-900 hover:bg-jewel-100 truncate"
                          >
                            {ev.name}
                          </div>
                        ))}
                        <div className="mt-auto space-y-1">
                          {dayEvents.length > 1 && (
                            <div className="text-[11px] text-jewel-400">
                              +{dayEvents.length - 1} more
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <aside className="mt-4 lg:mt-0 lg:w-80 lg:flex-shrink-0">
              <div className="rounded-2xl bg-jewel-50/80 border border-jewel-400/20 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-display font-bold text-jewel-900">
                    {selectedDate
                      ? selectedDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Upcoming events"}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/events")}
                    className="text-xs text-jewel-gold hover:text-jewel-500 hover:underline"
                  >
                    View all
                  </Button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-auto">
                  {(selectedDate
                    ? eventsByDay.get(selectedDate.toISOString().slice(0, 10)) || []
                    : events.slice(0, 50)
                  ).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-jewel-50/50 border border-jewel-400/20 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-jewel-900">{ev.name}</div>
                        <div className="text-xs text-jewel-500">
                          {new Date(ev.date).toLocaleString()}
                        </div>
                        {ev.venue && (
                          <div className="text-xs text-jewel-500">{ev.venue}</div>
                        )}
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <Button
                          variant="secondary"
                          onClick={() => router.push(`/events/${ev.id}`)}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}

                  {selectedDate &&
                    (eventsByDay.get(selectedDate.toISOString().slice(0, 10)) || []).length === 0 && (
                      <div className="text-sm text-jewel-400">No events on this day</div>
                    )}
                </div>
              </div>
            </aside>
          </div>

          {loading && (
            <div className="mt-4 text-sm text-jewel-400">Loading events...</div>
          )}
        </div>
      </div>
    </DreamySunsetBackground>
  );
}
