"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Search, X, ChevronDown } from "lucide-react";

import { API_BASE } from "../../lib/config";
import { apiFetch } from "../../lib/api";
import { useLocale } from "../../lib/LocaleContext";

type Conversation = {
    id: string;
    participants: { id: string; name?: string }[];
    unreadCount?: number;
    lastMessage?: string | null;
};

type Message = {
    id: string;
    clientId?: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
    readBy?: string[];
    status?: "sending" | "sent" | "failed";
};

// --- Message grouping helpers ---

type GroupedMessage = {
    date: string;
    messages: Message[];
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
};

/**
 * Formats a date into a human-friendly label for a date separator.
 * Returns "Today" / "Yesterday" where applicable, otherwise a localized
 * weekday/month/day/year string.
 *
 * @param date - The date to label.
 * @param locale - BCP-47 locale string used for non-relative formatting.
 * @returns The display label for the date separator.
 */
function formatDateLabel(date: Date, locale: string): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString(locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * Wraps every case-insensitive occurrence of `query` inside `text` in a
 * `<mark>` element so matches are visually highlighted.
 *
 * @param text - The source text to search within.
 * @param query - The (possibly empty) search term.
 * @returns The original string, or a React node array with matches highlighted.
 */
function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark key={i} className="bg-saffron/30 text-ink rounded px-0.5">
                {part}
            </mark>
        ) : (
            part
        ),
    );
}

/**
 * Groups a flat, chronologically-ordered message list into chunks that
 * share both the same calendar day and the same sender. Each returned
 * group also carries `isFirstInGroup` / `isLastInGroup` flags marking
 * whether it starts/ends a *date* section (used to render date
 * separators), independent of the sender chunking within that date.
 *
 * Note: this never reorders or drops messages — it only re-buckets the
 * array you give it, so passing the full message list keeps every
 * message visible (important for search, where you still want context
 * around a match rather than an isolated result).
 *
 * @param messages - Messages in chronological order.
 * @param locale - Reserved for callers that need it downstream; not used
 * for bucketing itself (bucketing is calendar-day based, locale-agnostic).
 * @returns An array of grouped messages, one entry per sender-run within a day.
 */
function groupMessagesByDateAndSender(
    messages: Message[],
    locale: string,
): GroupedMessage[] {
    void locale;
    if (messages.length === 0) return [];

    const groups: GroupedMessage[] = [];
    let currentGroup: Message[] = [];
    let currentDate = "";
    let currentSender = "";

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const msgDate = new Date(msg.createdAt).toDateString();
        const msgSender = msg.senderId;

        const isNewDate = msgDate !== currentDate;
        const isNewSender = msgSender !== currentSender;

        if (isNewDate || isNewSender) {
            if (currentGroup.length > 0) {
                groups.push({
                    date: currentDate,
                    messages: [...currentGroup],
                    isFirstInGroup: false,
                    isLastInGroup: false,
                });
            }
            currentGroup = [msg];
            currentDate = msgDate;
            currentSender = msgSender;
        } else {
            currentGroup.push(msg);
        }
    }

    if (currentGroup.length > 0) {
        groups.push({
            date: currentDate,
            messages: [...currentGroup],
            isFirstInGroup: false,
            isLastInGroup: false,
        });
    }

    // Mark the first/last sender-chunk within each calendar date so the
    // renderer knows exactly once per date where to draw the separator.
    return groups.map((g, idx, arr) => ({
        ...g,
        isFirstInGroup: idx === 0 || g.date !== arr[idx - 1].date,
        isLastInGroup: idx === arr.length - 1 || g.date !== arr[idx + 1].date,
    }));
}

/**
 * Finds the indices (into a `GroupedMessage[]`) of every group that
 * contains at least one message matching `query`, by content or sender name.
 *
 * @param groups - The grouped messages to search over.
 * @param query - The raw (non-empty) search term.
 * @returns Indices into `groups`, in ascending order.
 */
function findMatchingGroupIndices(
    groups: GroupedMessage[],
    query: string,
): number[] {
    const q = query.toLowerCase();
    const indices: number[] = [];
    groups.forEach((group, idx) => {
        const hasMatch = group.messages.some(
            (m) =>
                m.content.toLowerCase().includes(q) ||
                m.senderName.toLowerCase().includes(q),
        );
        if (hasMatch) indices.push(idx);
    });
    return indices;
}

/**
 * Performs chat operations.
 */
export default function ChatPage() {
    const { t } = useLocale();
    const [personal, setPersonal] = useState<Conversation[]>([]);
    const [familyChat, setFamilyChat] = useState<Conversation | null>(null);
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchIndex, setSearchIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pendingAcks = useRef<Map<string, number>>(new Map());
    const typingTimer = useRef<number | null>(null);
    const pendingAckTimeoutMs = 8000;
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    function getToken() {
        if (typeof window === "undefined") return null;
        return localStorage.getItem("token");
    }

    function getUserId() {
        if (typeof window === "undefined") return null;
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const parts = token.split(".");
            if (parts.length < 2) return null;
            const payload = JSON.parse(atob(parts[1]!));
            return payload.userId || payload.id || null;
        } catch (err) {
            console.error("Failed to decode token:", err);
            return null;
        }
    }

    const meId = getUserId();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const fetchChats = useCallback(async () => {
        const res = await apiFetch(`${API_BASE}/chat`);
        if (!res.ok) return;
        const js = await res.json();
        setPersonal(js.data.personal || []);
        setFamilyChat(js.data.familyChat || null);
    }, []);

    const connectWs = useCallback(() => {
        const token = getToken();
        if (!token) return;

        const proto = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${proto}://${window.location.hostname}:3002/`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.addEventListener("open", () => {
            reconnectAttempts.current = 0;
            try {
                ws.send(JSON.stringify({ type: "auth", token }));
            } catch (e) {
                console.error("Failed to send auth message", e);
            }
        });

        ws.addEventListener("message", (ev) => {
            try {
                const data = JSON.parse(ev.data);
                if (data.type === "chat_message") {
                    setMessages((m) => {
                        if (data.message?.clientId) {
                            return m.map((msg) =>
                                msg.clientId === data.message.clientId
                                    ? { ...data.message, status: "sent" }
                                    : msg,
                            );
                        }
                        return [...m, data.message];
                    });
                    setTimeout(() => scrollToBottom(), 50);
                } else if (data.type === "ack") {
                    if (data.clientId) {
                        setMessages((ms) =>
                            ms.map((msg) =>
                                msg.clientId === data.clientId
                                    ? {
                                          ...msg,
                                          id: data.messageId ?? msg.id,
                                          status:
                                              data.status === "ok"
                                                  ? "sent"
                                                  : "failed",
                                          createdAt:
                                              data.createdAt ?? msg.createdAt,
                                      }
                                    : msg,
                            ),
                        );
                        const to = pendingAcks.current.get(data.clientId);
                        if (to) {
                            clearTimeout(to);
                            pendingAcks.current.delete(data.clientId);
                        }
                        setTimeout(() => scrollToBottom(), 50);
                    }
                } else if (data.type === "typing") {
                    setTypingUsers((t) => ({
                        ...t,
                        [data.userId]: !!data.typing,
                    }));
                } else if (data.type === "read_receipt") {
                    const { messageId, userId } = data;
                    setMessages((ms) =>
                        ms.map((msg) =>
                            msg.id === messageId
                                ? {
                                      ...msg,
                                      readBy: [...(msg.readBy || []), userId],
                                  }
                                : msg,
                        ),
                    );
                }
            } catch (err) {
                console.error("WS parse error", err);
            }
        });

        ws.addEventListener("close", () => {
            wsRef.current = null;
            if (reconnectAttempts.current < maxReconnectAttempts) {
                const delay = Math.min(
                    1000 * 2 ** reconnectAttempts.current,
                    30000,
                );
                reconnectAttempts.current++;
                reconnectTimer.current = setTimeout(connectWs, delay);
            }
        });

        ws.addEventListener("error", () => {
            ws.close();
        });
    }, []);

    useEffect(() => {
        void fetchChats();
        connectWs();

        return () => {
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [fetchChats, connectWs]);

    async function loadConversation(conv: Conversation) {
        setSelected(conv);
        setMessages([]);
        const res = await apiFetch(
            `${API_BASE}/messages/conversations/${conv.id}/messages?limit=50`,
        );
        if (!res.ok) return;
        const js = await res.json();
        setMessages(js.data || []);

        const unread = js.data.filter(
            (m: Message) => !(m.readBy || []).includes(meId || ""),
        );
        for (const m of unread) {
            try {
                wsRef.current?.send(
                    JSON.stringify({
                        type: "read",
                        conversationId: conv.id,
                        messageId: m.id,
                    }),
                );
            } catch (err) {
                console.error("Failed to send read receipt", err);
            }
        }
        setTimeout(() => scrollToBottom(), 50);
    }

    function sendMessage() {
        if (!selected || !input.trim()) return;
        const clientId = `local-${Date.now()}`;
        const now = new Date().toISOString();
        const optimistic: Message = {
            id: clientId,
            clientId,
            conversationId: selected.id,
            senderId: meId || "me",
            senderName: "You",
            content: input.trim(),
            createdAt: now,
            status: "sending",
        };

        setMessages((m) => [...m, optimistic]);
        setInput("");
        setTimeout(() => scrollToBottom(), 20);

        const payload = {
            type: "chat_message",
            conversationId: selected.id,
            content: optimistic.content,
            clientId,
        };
        try {
            wsRef.current?.send(JSON.stringify(payload));
            wsRef.current?.send(
                JSON.stringify({
                    type: "typing",
                    conversationId: selected.id,
                    typing: false,
                }),
            );

            const tid = window.setTimeout(() => {
                setMessages((ms) =>
                    ms.map((msg) =>
                        msg.clientId === clientId
                            ? { ...msg, status: "failed" }
                            : msg,
                    ),
                );
                pendingAcks.current.delete(clientId);
            }, pendingAckTimeoutMs) as unknown as number;
            pendingAcks.current.set(clientId, tid);
        } catch (err) {
            console.error(err);
            setMessages((ms) =>
                ms.map((msg) =>
                    msg.clientId === clientId
                        ? { ...msg, status: "failed" }
                        : msg,
                ),
            );
        }
    }

    function onInputChange(v: string) {
        setInput(v);
        if (!selected) return;
        try {
            wsRef.current?.send(
                JSON.stringify({
                    type: "typing",
                    conversationId: selected.id,
                    typing: true,
                }),
            );
        } catch (err) {
            console.error("Failed to send typing event", err);
        }
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => {
            try {
                wsRef.current?.send(
                    JSON.stringify({
                        type: "typing",
                        conversationId: selected.id,
                        typing: false,
                    }),
                );
            } catch (err) {
                console.error("Failed to send typing stop", err);
            }
        }, 2000) as unknown as number;
    }

    /**
     * Scrolls the virtualized message list to the most recent group.
     * Safe to call even when the list is empty or not yet mounted.
     */
    function scrollToBottom() {
        try {
            if (groupedMessages.length > 0) {
                virtualizer.scrollToIndex(groupedMessages.length - 1, {
                    align: "end",
                    behavior: "auto",
                });
            }
        } catch (err) {
            console.error("Failed to scroll", err);
        }
    }

    // --- Grouped messages for virtualization ---
    // Always built from the full, unfiltered message list. Searching only
    // affects which groups we jump/scroll to and highlight — it never
    // removes messages from the timeline, so surrounding context stays
    // visible while navigating results.
    const groupedMessages = useMemo(() => {
        if (!selected) return [];
        const locale = t.locale || "en";
        return groupMessagesByDateAndSender(messages, locale);
    }, [messages, selected, t]);

    // --- Search result indices (indices into groupedMessages) ---
    const searchMatchIndices = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return findMatchingGroupIndices(groupedMessages, searchQuery);
    }, [groupedMessages, searchQuery]);

    const parentRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count: groupedMessages.length,
        getScrollElement: () => parentRef.current,
        // Rough starting estimate only — actual height is measured per row
        // below via `measureElement`, since a sender-run group can contain
        // anywhere from one to many messages of varying length.
        estimateSize: () => 96,
        overscan: 6,
        scrollPaddingStart: 0,
    });

    function retryMessage(msg: Message) {
        if (!selected) return;
        const newClientId = `local-${Date.now()}`;
        setMessages((ms) =>
            ms.map((m) =>
                m.clientId === msg.clientId
                    ? {
                          ...m,
                          clientId: newClientId,
                          status: "sending",
                          id: newClientId,
                      }
                    : m,
            ),
        );
        const payload = {
            type: "chat",
            conversationId: selected.id,
            content: msg.content,
            clientId: newClientId,
        };
        try {
            wsRef.current?.send(JSON.stringify(payload));
            const tid = window.setTimeout(() => {
                setMessages((ms) =>
                    ms.map((m) =>
                        m.clientId === newClientId
                            ? { ...m, status: "failed" }
                            : m,
                    ),
                );
                pendingAcks.current.delete(newClientId);
            }, pendingAckTimeoutMs) as unknown as number;
            pendingAcks.current.set(newClientId, tid);
        } catch (err) {
            console.error(err);
            setMessages((ms) =>
                ms.map((m) =>
                    m.clientId === newClientId ? { ...m, status: "failed" } : m,
                ),
            );
        }
    }

    /**
     * Opens or closes the in-conversation search bar, clearing the query
     * and focusing the input on open.
     */
    function toggleSearch() {
        setSearchOpen((prev) => {
            if (prev) {
                setSearchQuery("");
                setSearchIndex(-1);
            } else {
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
            return !prev;
        });
    }

    /**
     * Moves the active search result forward or backward, wrapping around
     * the ends of the match list.
     *
     * @param direction - "next" to advance, "prev" to go back.
     */
    function navigateSearch(direction: "next" | "prev") {
        if (searchMatchIndices.length === 0) return;
        setSearchIndex((prev) => {
            if (prev === -1) return searchMatchIndices[0];
            const currentPos = searchMatchIndices.indexOf(prev);
            if (direction === "next") {
                const next = currentPos + 1;
                return next >= searchMatchIndices.length
                    ? searchMatchIndices[0]
                    : searchMatchIndices[next];
            }
            const prevPos = currentPos - 1;
            return prevPos < 0
                ? searchMatchIndices[searchMatchIndices.length - 1]
                : searchMatchIndices[prevPos];
        });
    }

    // Scroll to search match when searchIndex changes
    useEffect(() => {
        if (searchIndex >= 0 && virtualizer) {
            virtualizer.scrollToIndex(searchIndex, {
                align: "center",
                behavior: "smooth",
            });
        }
    }, [searchIndex, virtualizer]);

    if (!hydrated) return null;
    if (hydrated && !getToken()) return <NotAuthenticated />;

    return (
        <div className="min-h-screen px-6 py-10">
            <div className="mx-auto max-w-7xl">
                <Card className="overflow-hidden">
                    <div className="grid min-h-[85vh] grid-cols-1 md:grid-cols-5">
                        {/* Sidebar */}
                        <div className="border-border bg-surface border-b md:col-span-1 md:border-r md:border-b-0">
                            <div className="p-5">
                                <h3 className="text-ink font-display text-lg font-bold tracking-tight">
                                    {t("chat.title")}
                                </h3>
                                <p className="text-ink-muted mt-1 text-xs">
                                    {t("chat.subtitle")}
                                </p>
                            </div>

                            <div className="max-h-[70vh] space-y-2 overflow-auto px-3 pb-4">
                                {personal.map((c) => {
                                    const title =
                                        c.participants
                                            ?.map((p) => p.name || p.id)
                                            .join(", ") ||
                                        t("chat.conversation");
                                    const isActive = selected?.id === c.id;

                                    return (
                                        <Button
                                            variant="secondary"
                                            key={c.id}
                                            onClick={() => loadConversation(c)}
                                            className={`
                        w-full text-left px-4 py-3 border transition
                        ${
                            isActive
                                ? "bg-saffron/10 border-saffron/30"
                                : "bg-transparent border-transparent hover:bg-surface hover:border-border"
                        }
                      `}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-ink truncate font-medium">
                                                        {title}
                                                    </div>
                                                    <div className="text-ink-muted mt-1 truncate text-xs">
                                                        {c.lastMessage ||
                                                            t(
                                                                "chat.noMessagesYet",
                                                            )}
                                                    </div>
                                                </div>
                                                {!!c.unreadCount &&
                                                    c.unreadCount > 0 && (
                                                        <span className="bg-saffron/20 border-saffron/30 text-ink rounded-full border px-2 py-1 text-xs">
                                                            {c.unreadCount}
                                                        </span>
                                                    )}
                                            </div>
                                        </Button>
                                    );
                                })}

                                {familyChat && (
                                    <Button
                                        variant="secondary"
                                        key={familyChat.id}
                                        onClick={() =>
                                            loadConversation(familyChat)
                                        }
                                        className={`
                      w-full text-left px-4 py-3 border transition
                      ${
                          selected?.id === familyChat.id
                              ? "bg-saffron/10 border-saffron/30"
                              : "bg-transparent border-transparent hover:bg-surface hover:border-border"
}
                    `}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-ink truncate font-medium">
                                                    {t("chat.familyChat")}
                                                </div>
                                                <div className="text-ink-muted mt-1 truncate text-xs">
                                                    {familyChat.lastMessage ||
                                                        t("chat.noMessagesYet")}
                                                </div>
                                            </div>
                                            {!!familyChat.unreadCount &&
                                                familyChat.unreadCount > 0 && (
                                                    <span className="bg-saffron/20 border-saffron/30 text-ink rounded-full border px-2 py-1 text-xs">
                                                        {familyChat.unreadCount}
                                                    </span>
                                                )}
                                        </div>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="bg-surface flex flex-col md:col-span-4">
                            {/* Header */}
                            <div className="border-border bg-surface border-b px-6 py-4">
                                {selected ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-ink text-base font-semibold">
                                                {selected === familyChat
                                                    ? t("chat.familyChat")
                                                    : selected.participants
                                                          ?.map(
                                                              (p) =>
                                                                  p.name ||
                                                                  p.id,
                                                          )
                                                          .join(", ")}
                                            </div>
                                            <div className="text-ink-muted mt-1 text-xs">
                                                {Object.entries(
                                                    typingUsers,
                                                ).some(([, v]) => v)
                                                    ? t("chat.someoneTyping")
                                                    : t("chat.online")}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-ink-muted text-xs">
                                                {t("chat.messageCount", {
                                                    count: messages.length,
                                                })}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={toggleSearch}
                                                className="text-ink-muted hover:text-ink p-2"
                                            >
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-ink-secondary font-medium">
                                        {t("chat.selectConversation")}
                                    </div>
                                )}
                                {searchOpen && selected && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="text-ink-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            <input
                                                ref={searchInputRef}
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(
                                                        e.target.value,
                                                    );
                                                    setSearchIndex(-1);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        navigateSearch(
                                                            e.shiftKey
                                                                ? "prev"
                                                                : "next",
                                                        );
                                                    }
                                                    if (e.key === "Escape") {
                                                        toggleSearch();
                                                    }
                                                }}
                                                placeholder={t(
                                                    "chat.searchPlaceholder",
                                                )}
                                                className="bg-surface border-border text-ink placeholder-ink-muted focus:ring-saffron/50 w-full border py-2 pr-20 pl-9 text-sm transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                                            />
                                            <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                                                {searchQuery && (
                                                    <span className="text-ink-muted px-1 text-xs">
                                                        {searchMatchIndices.length >
                                                        0
                                                            ? `${searchIndex >= 0 ? searchMatchIndices.indexOf(searchIndex) + 1 : 0}/${searchMatchIndices.length}`
                                                            : t(
                                                                  "chat.noResults",
                                                              )}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        navigateSearch("prev")
                                                    }
                                                    className="text-ink-muted hover:text-ink p-0.5 disabled:opacity-40"
                                                    disabled={
                                                        searchMatchIndices.length ===
                                                        0
                                                    }
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        navigateSearch("next")
                                                    }
                                                    className="text-ink-muted hover:text-ink p-0.5 disabled:opacity-40"
                                                    disabled={
                                                        searchMatchIndices.length ===
                                                        0
                                                    }
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={toggleSearch}
                                                    className="text-ink-muted hover:text-ink ml-0.5 p-0.5"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div
                                ref={parentRef}
                                className="flex-1 overflow-auto px-4 py-6 md:px-6"
                                style={{ height: "100%" }}
                            >
                                {!selected ? (
                                    <div className="text-ink-muted flex h-full items-center justify-center">
                                        {t("chat.pickChat")}
                                    </div>
                                ) : groupedMessages.length === 0 ? (
                                    <div className="text-ink-muted flex h-full items-center justify-center">
                                        {t("chat.noMessagesYet")}
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            height: `${virtualizer.getTotalSize()}px`,
                                            width: "100%",
                                            position: "relative",
                                        }}
                                    >
                                        {virtualizer
                                            .getVirtualItems()
                                            .map((virtualRow) => {
                                                const isActiveMatch =
                                                    searchQuery.trim() !== "" &&
                                                    virtualRow.index ===
                                                        searchIndex;
                                                return (
                                                    <div
                                                        key={virtualRow.key}
                                                        ref={
                                                            virtualizer.measureElement
                                                        }
                                                        data-index={
                                                            virtualRow.index
                                                        }
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            width: "100%",
                                                            transform: `translateY(${virtualRow.start}px)`,
                                                        }}
                                                        className={
                                                            isActiveMatch
                                                                ? "ring-2 ring-saffron/60 rounded"
                                                                : undefined
                                                        }
                                                    >
                                                        {(() => {
                                                            const group =
                                                                groupedMessages[
                                                                    virtualRow
                                                                        .index
                                                                ];
                                                            const dateLabel =
                                                                formatDateLabel(
                                                                    new Date(
                                                                        group.date,
                                                                    ),
                                                                    t.locale ||
                                                                        "en",
                                                                );
                                                            return (
                                                                <>
                                                                    {group.isFirstInGroup && (
                                                                        <div
                                                                            className="my-4 flex items-center justify-center"
                                                                            style={{
                                                                                zIndex: 1,
                                                                            }}
                                                                        >
                                                                            <div className="relative flex w-full items-center">
                                                                                <div className="absolute inset-0 flex items-center">
                                                                                    <div className="border-border w-full border-t" />
                                                                                </div>
                                                                                <div className="bg-surface relative flex items-center px-4">
                                                                                    <span className="text-ink-muted bg-surface px-2 py-1 text-xs font-medium">
                                                                                        {
                                                                                            dateLabel
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {group.messages.map(
                                                                        (
                                                                            m,
                                                                            msgIndex,
                                                                        ) => {
                                                                            const isMe =
                                                                                m.senderId ===
                                                                                    (meId ||
                                                                                        "") ||
                                                                                (m.clientId &&
                                                                                    m.senderName ===
                                                                                        "You");
                                                                            const isFirstInSenderGroup =
                                                                                msgIndex ===
                                                                                0;
                                                                            const isLastInSenderGroup =
                                                                                msgIndex ===
                                                                                group
                                                                                    .messages
                                                                                    .length -
                                                                                    1;

                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        m.id
                                                                                    }
                                                                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                                                                >
                                                                                    <div
                                                                                        className={`
                                                max-w-[78%] md:max-w-[60%] px-4 py-3 border mb-1
                                                ${
                                                    isMe
                                                        ? "bg-saffron/10 border-saffron/30 text-ink"
                                                        : "bg-surface border-border text-ink"
                                                }
                                                ${!isFirstInSenderGroup && !isMe ? "rounded-t-none border-t-0 -mt-1" : ""}
                                                ${!isLastInSenderGroup && !isMe ? "rounded-b-none border-b-0" : ""}
                                              `}
                                                                                    >
                                                                                        {!isMe &&
                                                                                            isFirstInSenderGroup && (
                                                                                                <div className="text-ink-muted mb-1 text-xs font-medium">
                                                                                                    {
                                                                                                        m.senderName
                                                                                                    }
                                                                                                </div>
                                                                                            )}
                                                                                        <div className="flex items-center gap-2">
                                                                                            {m.clientId && (
                                                                                                <div className="text-ink-muted text-caption">
                                                                                                    {m.status ===
                                                                                                    "sending"
                                                                                                        ? t(
                                                                                                              "chat.sending",
                                                                                                          )
                                                                                                        : m.status ===
                                                                                                            "failed"
                                                                                                          ? t(
                                                                                                                "chat.failed",
                                                                                                            )
                                                                                                          : t(
                                                                                                                "chat.sent",
                                                                                                            )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="text-body-lg mt-1 leading-relaxed">
                                                                                            {searchQuery.trim()
                                                                                                ? highlightMatch(
                                                                                                      m.content,
                                                                                                      searchQuery,
                                                                                                  )
                                                                                                : m.content}
                                                                                        </div>
                                                                                        <div className="text-ink-muted mt-2 flex items-center justify-between gap-3 text-caption">
                                                                                            <div>
                                                                                                {new Date(
                                                                                                    m.createdAt,
                                                                                                ).toLocaleString()}
                                                                                            </div>
                                                                                            {m.clientId &&
                                                                                                m.status ===
                                                                                                    "failed" && (
                                                                                                    <Button
                                                                                                        variant="ghost"
                                                                                                        size="sm"
                                                                                                        onClick={() =>
                                                                                                            retryMessage(
                                                                                                                m,
                                                                                                            )
                                                                                                        }
                                                                                                        className="text-ruby hover:text-ruby h-auto px-2 py-0.5 text-xs underline"
                                                                                                    >
                                                                                                        {t(
                                                                                                            "chat.retry",
                                                                                                        )}
                                                                                                    </Button>
                                                                                                )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        },
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>

                            {/* Typing indicator */}
                            {selected && (
                                <div className="text-ink-muted px-6 pb-2 text-xs">
                                    {Object.entries(typingUsers)
                                        .filter(([, v]) => v)
                                        .map(
                                            ([k]) => `${k} ${t("chat.typing")}`,
                                        )
                                        .join(" ")}
                                </div>
                            )}

                            {/* Input */}
                            {selected && (
                                <div className="border-border bg-surface border-t p-4 md:p-6">
                                    <div className="flex gap-3">
                                        <input
                                            value={input}
                                            onChange={(e) =>
                                                onInputChange(e.target.value)
                                            }
                                            placeholder={t("chat.typeMessage")}
                                            className="bg-surface border-border text-ink placeholder-ink-muted focus:ring-saffron/50 flex-1 border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    sendMessage();
                                            }}
                                        />
                                        <Button onClick={sendMessage}>
                                            {t("chat.send")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
