"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    Search,
    X,
    ChevronDown,
    Send,
    Check,
    AlertCircle,
    Loader2,
    Users,
    Plus,
    ArrowLeft,
} from "lucide-react";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";

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

type GroupedMessage = {
    date: string;
    messages: Message[];
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
};

function formatDateLabel(date: Date, locale: string): string {
    const today = new Date();
    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    }

    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }

    return date.toLocaleDateString(locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) {
        return text;
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (part.toLowerCase() === query.toLowerCase()) {
            return (
                <mark key={index} className="bg-saffron/20 text-ink rounded px-0.5">
                    {part}
                </mark>
            );
        }
        return <span key={index}>{part}</span>;
    });
}

function groupMessagesByDateAndSender(
    messages: Message[],
    locale: string,
): GroupedMessage[] {
    void locale;

    if (messages.length === 0) {
        return [];
    }

    const groups: GroupedMessage[] = [];

    let currentGroup: Message[] = [];
    let currentDate = "";
    let currentSender = "";

    for (const message of messages) {
        const messageDate = new Date(message.createdAt).toDateString();

        const messageSender = message.senderId;

        const isNewDate = messageDate !== currentDate;

        const isNewSender = messageSender !== currentSender;

        if (isNewDate || isNewSender) {
            if (currentGroup.length > 0) {
                groups.push({
                    date: currentDate,
                    messages: [...currentGroup],
                    isFirstInGroup: false,
                    isLastInGroup: false,
                });
            }

            currentGroup = [message];
            currentDate = messageDate;
            currentSender = messageSender;
        } else {
            currentGroup.push(message);
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

    return groups.map((group, index, array) => ({
        ...group,
        isFirstInGroup: index === 0 || group.date !== array[index - 1]?.date,
        isLastInGroup:
            index === array.length - 1 || group.date !== array[index + 1]?.date,
    }));
}

function findMatchingGroupIndices(
    groups: GroupedMessage[],
    query: string,
): number[] {
    const normalizedQuery = query.toLowerCase();

    const matches: number[] = [];

    groups.forEach((group, index) => {
        const match = group.messages.some(
            (message) =>
                message.content.toLowerCase().includes(normalizedQuery) ||
                message.senderName.toLowerCase().includes(normalizedQuery),
        );

        if (match) {
            matches.push(index);
        }
    });

    return matches;
}

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

    const [newChatOpen, setNewChatOpen] = useState(false);
    const [newChatQuery, setNewChatQuery] = useState("");
    const [newChatResults, setNewChatResults] = useState<
        { id: string; name: string; email: string; profile?: { profession?: string; location?: string } }[]
    >([]);
    const [newChatLoading, setNewChatLoading] = useState(false);

    const newChatInputRef = useRef<HTMLInputElement | null>(null);
    const newChatDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [hydrated, setHydrated] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);

    const pendingAcks = useRef<Map<string, number>>(new Map());

    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reconnectAttempts = useRef(0);

    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const parentRef = useRef<HTMLDivElement | null>(null);

    const pendingAckTimeoutMs = 8000;
    const maxReconnectAttempts = 5;

    function getToken() {
        if (typeof window === "undefined") {
            return null;
        }

        return localStorage.getItem("token");
    }

    function getUserId() {
        if (typeof window === "undefined") {
            return null;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            return null;
        }

        try {
            const parts = token.split(".");

            if (parts.length < 2) {
                return null;
            }

            const payload = JSON.parse(atob(parts[1]!));

            return payload.userId || payload.id || null;
        } catch (error) {
            console.error("Failed to decode token:", error);

            return null;
        }
    }

    const meId = getUserId();

    useEffect(() => {
        setHydrated(true);
    }, []);

    const fetchChats = useCallback(async () => {
        const response = await apiFetch(`${API_BASE}/chat`);

        if (!response.ok) {
            return;
        }

        const json = await response.json();

        setPersonal(json.data?.personal || []);

        setFamilyChat(json.data?.familyChat || null);
    }, []);

    const scrollToBottom = useCallback(() => {
        try {
            if (groupedMessages.length > 0) {
                virtualizer.scrollToIndex(groupedMessages.length - 1, {
                    align: "end",
                    behavior: "auto",
                });
            }
        } catch (error) {
            console.error("Failed to scroll:", error);
        }
    }, []);

    const connectWs = useCallback(() => {
        const token = getToken();

        if (!token) {
            return;
        }

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";

        const wsUrl = `${protocol}://${window.location.hostname}:3002/`;

        const ws = new WebSocket(wsUrl);

        wsRef.current = ws;

        ws.addEventListener("open", () => {
            reconnectAttempts.current = 0;

            try {
                ws.send(
                    JSON.stringify({
                        type: "auth",
                        token,
                    }),
                );
            } catch (error) {
                console.error("Failed to authenticate WebSocket:", error);
            }
        });

        ws.addEventListener("message", (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "chat_message") {
                    setMessages((current) => {
                        if (data.message?.clientId) {
                            return current.map((message) =>
                                message.clientId === data.message.clientId
                                    ? {
                                          ...data.message,
                                          status: "sent",
                                      }
                                    : message,
                            );
                        }

                        return [...current, data.message];
                    });

                    setTimeout(scrollToBottom, 50);
                }

                if (data.type === "ack") {
                    if (!data.clientId) {
                        return;
                    }

                    setMessages((current) =>
                        current.map((message) =>
                            message.clientId === data.clientId
                                ? {
                                      ...message,
                                      id: data.messageId ?? message.id,
                                      status:
                                          data.status === "ok"
                                              ? "sent"
                                              : "failed",
                                      createdAt:
                                          data.createdAt ?? message.createdAt,
                                  }
                                : message,
                        ),
                    );

                    const timeout = pendingAcks.current.get(data.clientId);

                    if (timeout) {
                        clearTimeout(timeout);

                        pendingAcks.current.delete(data.clientId);
                    }

                    setTimeout(scrollToBottom, 50);
                }

                if (data.type === "typing") {
                    setTypingUsers((current) => ({
                        ...current,
                        [data.userId]: !!data.typing,
                    }));
                }

                if (data.type === "read_receipt") {
                    const { messageId, userId } = data;

                    setMessages((current) =>
                        current.map((message) =>
                            message.id === messageId
                                ? {
                                      ...message,
                                      readBy: [
                                          ...(message.readBy || []),
                                          userId,
                                      ],
                                  }
                                : message,
                        ),
                    );
                }
            } catch (error) {
                console.error("WS parse error:", error);
            }
        });

        ws.addEventListener("close", () => {
            wsRef.current = null;

            if (reconnectAttempts.current < maxReconnectAttempts) {
                const delay = Math.min(
                    1000 * 2 ** reconnectAttempts.current,
                    30000,
                );

                reconnectAttempts.current += 1;

                reconnectTimer.current = setTimeout(connectWs, delay);
            }
        });

        ws.addEventListener("error", () => {
            ws.close();
        });
    }, [scrollToBottom]);

    useEffect(() => {
        void fetchChats();

        connectWs();

        return () => {
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }

            wsRef.current?.close();

            wsRef.current = null;
        };
    }, [fetchChats, connectWs]);

    async function loadConversation(conversation: Conversation) {
        setSelected(conversation);
        setMessages([]);
        setSearchQuery("");
        setSearchIndex(-1);

        const response = await apiFetch(
            `${API_BASE}/messages/conversations/${conversation.id}/messages?limit=50`,
        );

        if (!response.ok) {
            return;
        }

        const json = await response.json();

        const loadedMessages = json.data || [];

        setMessages(loadedMessages);

        const unreadMessages = loadedMessages.filter(
            (message: Message) => !(message.readBy || []).includes(meId || ""),
        );

        for (const message of unreadMessages) {
            try {
                wsRef.current?.send(
                    JSON.stringify({
                        type: "read",
                        conversationId: conversation.id,
                        messageId: message.id,
                    }),
                );
            } catch (error) {
                console.error("Failed to send read receipt:", error);
            }
        }

        setTimeout(scrollToBottom, 50);
    }

    function sendMessage() {
        if (!selected || !input.trim()) {
            return;
        }

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

        setMessages((current) => [...current, optimistic]);

        setInput("");

        setTimeout(scrollToBottom, 20);

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

            const timeout = window.setTimeout(() => {
                setMessages((current) =>
                    current.map((message) =>
                        message.clientId === clientId
                            ? {
                                  ...message,
                                  status: "failed",
                              }
                            : message,
                    ),
                );

                pendingAcks.current.delete(clientId);
            }, pendingAckTimeoutMs);

            pendingAcks.current.set(clientId, timeout);
        } catch (error) {
            console.error(error);

            setMessages((current) =>
                current.map((message) =>
                    message.clientId === clientId
                        ? {
                              ...message,
                              status: "failed",
                          }
                        : message,
                ),
            );
        }
    }

    function onInputChange(value: string) {
        setInput(value);

        if (!selected) {
            return;
        }

        try {
            wsRef.current?.send(
                JSON.stringify({
                    type: "typing",
                    conversationId: selected.id,
                    typing: true,
                }),
            );
        } catch (error) {
            console.error("Failed to send typing event:", error);
        }

        if (typingTimer.current) {
            clearTimeout(typingTimer.current);
        }

        typingTimer.current = setTimeout(() => {
            try {
                wsRef.current?.send(
                    JSON.stringify({
                        type: "typing",
                        conversationId: selected.id,
                        typing: false,
                    }),
                );
            } catch (error) {
                console.error("Failed to stop typing:", error);
            }
        }, 2000);
    }

    function retryMessage(message: Message) {
        if (!selected) {
            return;
        }

        const newClientId = `local-${Date.now()}`;

        setMessages((current) =>
            current.map((item) =>
                item.clientId === message.clientId
                    ? {
                          ...item,
                          clientId: newClientId,
                          status: "sending",
                          id: newClientId,
                      }
                    : item,
            ),
        );

        const payload = {
            type: "chat",
            conversationId: selected.id,
            content: message.content,
            clientId: newClientId,
        };

        try {
            wsRef.current?.send(JSON.stringify(payload));

            const timeout = window.setTimeout(() => {
                setMessages((current) =>
                    current.map((item) =>
                        item.clientId === newClientId
                            ? {
                                  ...item,
                                  status: "failed",
                              }
                            : item,
                    ),
                );

                pendingAcks.current.delete(newClientId);
            }, pendingAckTimeoutMs);

            pendingAcks.current.set(newClientId, timeout);
        } catch (error) {
            console.error(error);

            setMessages((current) =>
                current.map((item) =>
                    item.clientId === newClientId
                        ? {
                              ...item,
                              status: "failed",
                          }
                        : item,
                ),
            );
        }
    }

    function toggleSearch() {
        setSearchOpen((previous) => {
            if (previous) {
                setSearchQuery("");
                setSearchIndex(-1);
            } else {
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }

            return !previous;
        });
    }

    function navigateSearch(direction: "next" | "prev") {
        if (searchMatchIndices.length === 0) {
            return;
        }

        setSearchIndex((previous) => {
            if (previous === -1) {
                return searchMatchIndices[0]!;
            }

            const currentPosition = searchMatchIndices.indexOf(previous);

            if (direction === "next") {
                const next = currentPosition + 1;

                return next >= searchMatchIndices.length
                    ? searchMatchIndices[0]!
                    : searchMatchIndices[next]!;
            }

            const previousPosition = currentPosition - 1;

            return previousPosition < 0
                ? searchMatchIndices[searchMatchIndices.length - 1]!
                : searchMatchIndices[previousPosition]!;
        });
    }

    function onNewChatQueryChange(value: string) {
        setNewChatQuery(value);

        if (newChatDebounce.current) {
            clearTimeout(newChatDebounce.current);
        }

        if (!value.trim()) {
            setNewChatResults([]);
            return;
        }

        newChatDebounce.current = setTimeout(async () => {
            setNewChatLoading(true);
            try {
                const response = await apiFetch(
                    `${API_BASE}/messages/search-users?q=${encodeURIComponent(value.trim())}`,
                );
                if (response.ok) {
                    const json = await response.json();
                    setNewChatResults(json.data || []);
                }
            } catch {
                // ignore
            } finally {
                setNewChatLoading(false);
            }
        }, 300);
    }

    async function startConversation(userId: string) {
        try {
            const response = await apiFetch(
                `${API_BASE}/messages/conversations`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ participantIds: [userId] }),
                },
            );

            if (!response.ok) return;

            const json = await response.json();
            const conversation = json.data;

            // Refresh conversation list
            await fetchChats();

            // Open the conversation
            setSelected({
                id: conversation.id,
                participants: conversation.participants.map((p: string) => ({
                    id: p,
                })),
            });
            setMessages([]);
            setNewChatOpen(false);
            setNewChatQuery("");
            setNewChatResults([]);

            // Load messages for the new conversation
            const msgResponse = await apiFetch(
                `${API_BASE}/messages/conversations/${conversation.id}/messages?limit=50`,
            );
            if (msgResponse.ok) {
                const msgJson = await msgResponse.json();
                setMessages(msgJson.data || []);
                setTimeout(scrollToBottom, 50);
            }
        } catch {
            // ignore
        }
    }

    const groupedMessages = useMemo(() => {
        if (!selected) {
            return [];
        }

        return groupMessagesByDateAndSender(messages, "en");
    }, [messages, selected]);

    const searchMatchIndices = useMemo(() => {
        if (!searchQuery.trim()) {
            return [];
        }

        return findMatchingGroupIndices(groupedMessages, searchQuery);
    }, [groupedMessages, searchQuery]);

    const virtualizer = useVirtualizer({
        count: groupedMessages.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 96,
        overscan: 6,
        scrollPaddingStart: 12,
    });

    useEffect(() => {
        if (searchIndex < 0) {
            return;
        }

        virtualizer.scrollToIndex(searchIndex, {
            align: "center",
            behavior: "smooth",
        });
    }, [searchIndex, virtualizer]);

    const personalConversations = personal;

    const totalUnread =
        personal.reduce(
            (sum, conversation) => sum + (conversation.unreadCount || 0),
            0,
        ) + (familyChat?.unreadCount || 0);

    function getConversationTitle(conversation: Conversation) {
        if (familyChat?.id === conversation.id) {
            return t("chat.familyChat");
        }

        return (
            conversation.participants
                ?.map((participant) => participant.name || participant.id)
                .join(", ") || t("chat.conversation")
        );
    }

    if (!hydrated) {
        return null;
    }

    if (!getToken()) {
        return <NotAuthenticated />;
    }

    return (
        <div className="flex h-[calc(100vh-5rem)] w-full overflow-hidden">
            {/* ── Conversations panel ── */}
            <aside className="border-border flex w-72 shrink-0 flex-col border-r bg-white">
                {/* Panel header */}
                <div className="flex h-11 shrink-0 items-center justify-between px-4">
                    {newChatOpen ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setNewChatOpen(false);
                                    setNewChatQuery("");
                                    setNewChatResults([]);
                                }}
                                className="text-ink-muted hover:text-ink flex h-6 w-6 items-center justify-center rounded transition-colors"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                            <h1 className="text-ink flex-1 text-center text-[13px] font-semibold tracking-tight">
                                New Chat
                            </h1>
                            <div className="w-6" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-ink text-[13px] font-semibold tracking-tight">
                                {t("chat.title")}
                            </h1>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setNewChatOpen(true)}
                                    className="text-ink-muted hover:text-ink flex h-6 w-6 items-center justify-center rounded transition-colors"
                                    aria-label="New chat"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchOpen(true);
                                        setTimeout(
                                            () => searchInputRef.current?.focus(),
                                            50,
                                        );
                                    }}
                                    className="text-ink-muted hover:text-ink flex h-6 w-6 items-center justify-center rounded transition-colors"
                                    aria-label="Search"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* New chat: user search */}
                {newChatOpen && (
                    <div className="border-border border-b px-3 py-2">
                        <div className="relative">
                            <Search className="text-ink-muted absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                            <input
                                ref={newChatInputRef}
                                autoFocus
                                value={newChatQuery}
                                onChange={(event) =>
                                    onNewChatQueryChange(event.target.value)
                                }
                                placeholder="Search people..."
                                className="bg-surface-muted text-ink placeholder:text-ink-muted h-8 w-full rounded-md pl-8 pr-3 text-[13px] outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* New chat: results */}
                {newChatOpen && (
                    <div className="flex-1 overflow-y-auto">
                        {newChatLoading && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="text-ink-muted h-4 w-4 animate-spin" />
                            </div>
                        )}

                        {!newChatLoading &&
                            newChatQuery.trim() &&
                            newChatResults.length === 0 && (
                                <p className="text-ink-muted px-4 py-8 text-center text-[13px]">
                                    No users found
                                </p>
                            )}

                        {!newChatLoading &&
                            newChatResults.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => startConversation(user.id)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition hover:bg-surface-muted"
                                >
                                    <div className="bg-surface-muted text-ink-secondary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
                                        {(user.name?.[0] || "?").toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-ink truncate text-[13px] font-medium">
                                            {user.name}
                                        </div>
                                        <div className="text-ink-muted truncate text-[11px]">
                                            {user.profile?.profession ||
                                                user.email}
                                        </div>
                                    </div>
                                </button>
                            ))}

                        {!newChatLoading &&
                            !newChatQuery.trim() &&
                            newChatResults.length === 0 && (
                                <p className="text-ink-muted px-4 py-8 text-center text-[13px]">
                                    Search by name or email
                                </p>
                            )}
                    </div>
                )}

                {/* Existing conversation list */}
                {!newChatOpen && (
                    <>
                    {/* Search (toggle) */}
                    {searchOpen && (
                        <div className="border-border border-t border-b px-3 py-2">
                            <div className="relative">
                                <Search className="text-ink-muted absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                                <input
                                    ref={searchInputRef}
                                    value={searchQuery}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                        setSearchIndex(-1);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter")
                                            navigateSearch(
                                                event.shiftKey ? "prev" : "next",
                                            );
                                        if (event.key === "Escape")
                                            toggleSearch();
                                    }}
                                    placeholder={t("chat.searchPlaceholder")}
                                    className="bg-surface-muted text-ink placeholder:text-ink-muted h-8 w-full rounded-md pr-7 pl-8 text-[13px] outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={toggleSearch}
                                    className="text-ink-muted hover:text-ink absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto px-2 py-1.5">
                    {/* Family chat */}
                    {familyChat && (
                        <>
                            <div className="text-ink-muted mb-0.5 px-2 pt-1.5 pb-0.5 text-[10px] font-medium uppercase tracking-wider">
                                {t("chat.familyChat")}
                            </div>
                            <button
                                type="button"
                                onClick={() => loadConversation(familyChat)}
                                className={`
                                    flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition
                                    ${selected?.id === familyChat.id ? "bg-saffron/10" : "hover:bg-surface-muted"}
                                `}
                            >
                                <div
                                    className={`
                                        flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium
                                        ${selected?.id === familyChat.id ? "bg-saffron text-white" : "bg-surface-muted text-ink-secondary"}
                                    `}
                                >
                                    <Users className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-ink truncate text-[13px] font-medium">
                                            {t("chat.familyChat")}
                                        </span>
                                        {familyChat.unreadCount ? (
                                            <span className="bg-saffron shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold text-white">
                                                {familyChat.unreadCount}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="text-ink-muted truncate text-[12px] leading-tight">
                                        {familyChat.lastMessage ||
                                            t("chat.noMessagesYet")}
                                    </p>
                                </div>
                            </button>
                        </>
                    )}

                    {/* Personal conversations */}
                    <div className="text-ink-muted mb-0.5 px-2 pt-3 pb-0.5 text-[10px] font-medium uppercase tracking-wider">
                        {t("chat.title")}
                    </div>

                    {personalConversations.length === 0 ? (
                        <p className="text-ink-muted px-2 py-6 text-[13px]">
                            {t("chat.noMessagesYet")}
                        </p>
                    ) : (
                        personalConversations.map((conversation) => {
                            const isActive = selected?.id === conversation.id;
                            return (
                                <button
                                    key={conversation.id}
                                    type="button"
                                    onClick={() =>
                                        loadConversation(conversation)
                                    }
                                    className={`
                                        flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition
                                        ${isActive ? "bg-saffron/10" : "hover:bg-surface-muted"}
                                    `}
                                >
                                    <div
                                        className={`
                                            flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium
                                            ${isActive ? "bg-saffron text-white" : "bg-surface-muted text-ink-secondary"}
                                        `}
                                    >
                                        {(
                                            getConversationTitle(conversation)[0] ||
                                            "?"
                                        ).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-ink truncate text-[13px] font-medium">
                                                {getConversationTitle(conversation)}
                                            </span>
                                            {conversation.unreadCount ? (
                                                <span className="bg-saffron shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold text-white">
                                                    {conversation.unreadCount}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-ink-muted truncate text-[12px] leading-tight">
                                            {conversation.lastMessage ||
                                                t("chat.noMessagesYet")}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
                    </>
                )}
            </aside>

            {/* ── Chat surface ── */}
            <section className="bg-surface flex min-w-0 flex-1 flex-col">
                {/* Chat header */}
                <header className="border-border flex h-11 shrink-0 items-center justify-between border-b px-4">
                    {selected ? (
                        <>
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div className="bg-saffron/10 text-saffron flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
                                    {selected === familyChat ? (
                                        <Users className="h-3.5 w-3.5" />
                                    ) : (
                                        (
                                            getConversationTitle(selected)[0] ||
                                            "?"
                                        ).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-ink truncate text-[13px] font-medium">
                                        {getConversationTitle(selected)}
                                    </span>
                                    <span className="text-ink-muted ml-2 text-[11px]">
                                        {Object.values(typingUsers).some(Boolean)
                                            ? t("chat.someoneTyping")
                                            : t("chat.online")}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={toggleSearch}
                                className="text-ink-muted hover:text-ink flex h-7 w-7 items-center justify-center rounded transition-colors"
                            >
                                <Search className="h-3.5 w-3.5" />
                            </button>
                        </>
                    ) : (
                        <span className="text-ink-muted text-[13px]">
                            {t("chat.selectConversation")}
                        </span>
                    )}
                </header>

                {/* Search bar (in-chat) */}
                {searchOpen && selected && (
                    <div className="border-border border-b px-4 py-2">
                        <div className="relative">
                            <Search className="text-ink-muted absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                            <input
                                ref={searchInputRef}
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setSearchIndex(-1);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        navigateSearch(
                                            event.shiftKey ? "prev" : "next",
                                        );
                                    }
                                    if (event.key === "Escape")
                                        toggleSearch();
                                }}
                                placeholder={t("chat.searchPlaceholder")}
                                className="bg-surface-muted text-ink placeholder:text-ink-muted h-8 w-full rounded-md pr-24 pl-8 text-[13px] outline-none"
                            />
                            <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
                                {searchQuery && (
                                    <span className="text-ink-muted mr-1 text-[10px]">
                                        {searchMatchIndices.length > 0
                                            ? `${
                                                  searchIndex >= 0
                                                      ? searchMatchIndices.indexOf(searchIndex) + 1
                                                      : 0
                                              }/${searchMatchIndices.length}`
                                            : t("chat.noResults")}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => navigateSearch("prev")}
                                    disabled={!searchMatchIndices.length}
                                    className="text-ink-muted hover:text-ink rounded p-0.5 disabled:opacity-30"
                                >
                                    <ChevronDown className="h-3 w-3 rotate-180" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigateSearch("next")}
                                    disabled={!searchMatchIndices.length}
                                    className="text-ink-muted hover:text-ink rounded p-0.5 disabled:opacity-30"
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleSearch}
                                    className="text-ink-muted hover:text-ink rounded p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages area */}
                <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
                    {!selected ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <p className="text-ink-muted text-[13px]">
                                {t("chat.selectConversation")}
                            </p>
                            <p className="text-ink-muted/60 mt-1 text-[12px]">
                                {t("chat.pickChat")}
                            </p>
                        </div>
                    ) : groupedMessages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <p className="text-ink-muted text-[13px]">
                                {t("chat.noMessagesYet")}
                            </p>
                            <p className="text-ink-muted/60 mt-1 text-[12px]">
                                {t("chat.typeMessage")}
                            </p>
                        </div>
                    ) : (
                        <div
                            className="relative w-full px-4 py-4"
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const group = groupedMessages[virtualRow.index];
                                if (!group) return null;

                                const isActiveMatch =
                                    searchQuery.trim() !== "" &&
                                    virtualRow.index === searchIndex;

                                const dateLabel = formatDateLabel(
                                    new Date(group.date),
                                    "en",
                                );

                                return (
                                    <div
                                        key={virtualRow.key}
                                        ref={virtualizer.measureElement}
                                        data-index={virtualRow.index}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            paddingLeft: "1rem",
                                            paddingRight: "1rem",
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                        className={
                                            isActiveMatch
                                                ? "bg-saffron/5 rounded-md"
                                                : ""
                                        }
                                    >
                                        {group.isFirstInGroup && (
                                            <div className="my-3 flex items-center gap-3">
                                                <div className="bg-border h-px flex-1" />
                                                <span className="text-ink-muted text-[10px] font-medium">
                                                    {dateLabel}
                                                </span>
                                                <div className="bg-border h-px flex-1" />
                                            </div>
                                        )}

                                        {group.messages.map(
                                            (message, messageIndex) => {
                                                const isMe =
                                                    message.senderId ===
                                                        (meId || "") ||
                                                    (message.clientId &&
                                                        message.senderName ===
                                                            "You");

                                                const isFirst =
                                                    messageIndex === 0;
                                                const isLast =
                                                    messageIndex ===
                                                    group.messages.length - 1;

                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={`mb-1 flex ${isMe ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div
                                                            className={`max-w-[75%] sm:max-w-[60%] lg:max-w-[45%] ${isMe ? "items-end" : "items-start"}`}
                                                        >
                                                            {!isMe && isFirst && (
                                                                <div className="text-ink-muted mb-0.5 ml-0.5 text-[10px] font-medium">
                                                                    {message.senderName}
                                                                </div>
                                                            )}

                                                            <div
                                                                className={`
                                                                    px-3 py-2 text-[13px] leading-[1.4]
                                                                    ${isMe
                                                                        ? "bg-saffron text-white rounded-xl rounded-br-sm"
                                                                        : "bg-surface-muted text-ink rounded-xl rounded-bl-sm"
                                                                    }
                                                                    ${isLast && !isFirst ? (isMe ? "rounded-tr-sm" : "rounded-tl-sm") : ""}
                                                                `}
                                                            >
                                                                <span className="break-words whitespace-pre-wrap">
                                                                    {searchQuery.trim()
                                                                        ? highlightMatch(message.content, searchQuery)
                                                                        : message.content}
                                                                </span>

                                                                <span
                                                                    className={`
                                                                        ml-2 inline-flex items-center gap-1 align-bottom text-[10px]
                                                                        ${isMe ? "text-white/60" : "text-ink-muted"}
                                                                    `}
                                                                >
                                                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    })}
                                                                    {message.clientId && (
                                                                        <>
                                                                            {message.status === "sending" && (
                                                                                <Loader2 className="inline h-2.5 w-2.5 animate-spin" />
                                                                            )}
                                                                            {message.status === "sent" && (
                                                                                <Check className="inline h-2.5 w-2.5" />
                                                                            )}
                                                                            {message.status === "failed" && (
                                                                                <AlertCircle className="text-ruby inline h-2.5 w-2.5" />
                                                                            )}
                                                                        </>
                                                                    )}
                                                                    {message.clientId &&
                                                                        message.status === "failed" && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => retryMessage(message)}
                                                                                className="text-ruby underline underline-offset-1"
                                                                            >
                                                                                {t("chat.retry")}
                                                                            </button>
                                                                        )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Typing indicator */}
                {selected && (
                    <div className="text-ink-muted min-h-4 shrink-0 px-4 text-[11px]">
                        {Object.entries(typingUsers)
                            .filter(([, v]) => v)
                            .map(([k]) => `${k} ${t("chat.typing")}`)
                            .join(" ")}
                    </div>
                )}

                {/* Composer */}
                {selected && (
                    <div className="border-border shrink-0 border-t px-4 py-3">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                sendMessage();
                            }}
                            className="flex items-end gap-2"
                        >
                            <textarea
                                value={input}
                                onChange={(event) =>
                                    onInputChange(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" &&
                                        !event.shiftKey
                                    ) {
                                        event.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                rows={1}
                                placeholder={t("chat.typeMessage")}
                                className="bg-surface-muted text-ink placeholder:text-ink-muted max-h-28 min-h-9 flex-1 resize-none rounded-lg px-3 py-2 text-[13px] leading-[1.4] outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-saffron hover:bg-saffron/90 disabled:bg-surface-muted disabled:text-ink-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors disabled:cursor-not-allowed"
                                aria-label={t("chat.send")}
                            >
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </form>
                        <div className="text-ink-muted/50 mt-1 hidden text-[10px] sm:block">
                            Enter to send · Shift+Enter for new line
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
