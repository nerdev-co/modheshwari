"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

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

/**
 * Performs chat operations.
 * @returns {React.JSX.Element} Description of return value
 */
export default function ChatPage() {
    const { t } = useLocale();
    const [personal, setPersonal] = useState<Conversation[]>([]);
    const [familyChat, setFamilyChat] = useState<Conversation | null>(null);
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

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
                                        status: data.status === "ok" ? "sent" : "failed",
                                        createdAt: data.createdAt ?? msg.createdAt,
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
                    setTypingUsers((t) => ({ ...t, [data.userId]: !!data.typing }));
                } else if (data.type === "read_receipt") {
                    const { messageId, userId } = data;
                    setMessages((ms) =>
                        ms.map((msg) =>
                            msg.id === messageId
                                ? { ...msg, readBy: [...(msg.readBy || []), userId] }
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
                const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
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
                        msg.clientId === clientId ? { ...msg, status: "failed" } : msg,
                    ),
                );
                pendingAcks.current.delete(clientId);
            }, pendingAckTimeoutMs) as unknown as number;
            pendingAcks.current.set(clientId, tid);
        } catch (err) {
            console.error(err);
            setMessages((ms) =>
                ms.map((msg) =>
                    msg.clientId === clientId ? { ...msg, status: "failed" } : msg,
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

    function scrollToBottom() {
        try {
            const el = containerRef.current;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        } catch (err) {
            console.error("Failed to scroll", err);
        }
    }

    function retryMessage(msg: Message) {
        if (!selected) return;
        const newClientId = `local-${Date.now()}`;
        setMessages((ms) =>
            ms.map((m) =>
                m.clientId === msg.clientId
                    ? { ...m, clientId: newClientId, status: "sending", id: newClientId }
                    : m,
            ),
        );
        const payload = {
            type: "chat_message",
            conversationId: selected.id,
            content: msg.content,
            clientId: newClientId,
        };
        try {
            wsRef.current?.send(JSON.stringify(payload));
            const tid = window.setTimeout(() => {
                setMessages((ms) =>
                    ms.map((m) =>
                        m.clientId === newClientId ? { ...m, status: "failed" } : m,
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

    if (!hydrated) return null;
    if (hydrated && !getToken()) return <NotAuthenticated />;

    return (
        <DreamySunsetBackground className="px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl border border-jewel-400/20 shadow-jewel overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-5 min-h-[85vh]">
                        {/* Sidebar */}
                        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-jewel-400/20 bg-jewel-100/40">
                            <div className="p-5">
                                <h3 className="text-lg font-display font-bold text-jewel-900 tracking-tight">{t("chat.title")}</h3>
                                <p className="text-xs text-jewel-500 mt-1">
                                    {t("chat.subtitle")}
                                </p>
                            </div>

                            <div className="px-3 pb-4 space-y-2 overflow-auto max-h-[70vh]">
                                {personal.map((c) => {
                                    const title =
                                        c.participants?.map((p) => p.name || p.id).join(", ") ||
                                        t("chat.conversation");
                                    const isActive = selected?.id === c.id;

                                    return (
                                        <Button
                                            variant="secondary"
                                            key={c.id}
                                            onClick={() => loadConversation(c)}
                                            className={`
                        w-full text-left px-4 py-3 rounded-2xl border transition
                        ${isActive
                                                    ? "bg-jewel-gold/10 border-jewel-gold/30"
                                                    : "bg-transparent border-transparent hover:bg-jewel-100 hover:border-jewel-400/20"
                                                }
                      `}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="font-medium text-jewel-900 truncate">
                                                        {title}
                                                    </div>
                                                    <div className="text-xs text-jewel-500 truncate mt-1">
                                                        {c.lastMessage || t("chat.noMessagesYet")}
                                                    </div>
                                                </div>
                                                {!!c.unreadCount && c.unreadCount > 0 && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-jewel-gold/20 border border-jewel-gold/30 text-jewel-800">
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
                                         onClick={() => loadConversation(familyChat)}
                                         className={`
                      w-full text-left px-4 py-3 rounded-2xl border transition
                      ${selected?.id === familyChat.id
                                                 ? "bg-jewel-gold/10 border-jewel-gold/30"
                                                 : "bg-transparent border-transparent hover:bg-jewel-100 hover:border-jewel-400/20"
                                             }
                    `}
                                     >
                                         <div className="flex items-center justify-between gap-3">
                                             <div className="min-w-0">
                                                 <div className="font-medium text-jewel-900 truncate">
                                                     {t("chat.familyChat")}
                                                 </div>
                                                 <div className="text-xs text-jewel-500 truncate mt-1">
                                                     {familyChat.lastMessage || t("chat.noMessagesYet")}
                                                 </div>
                                             </div>
                                             {!!familyChat.unreadCount && familyChat.unreadCount > 0 && (
                                                 <span className="text-xs px-2 py-1 rounded-full bg-jewel-gold/20 border border-jewel-gold/30 text-jewel-800">
                                                     {familyChat.unreadCount}
                                                 </span>
                                             )}
                                         </div>
                                     </Button>
                                 )}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="md:col-span-4 flex flex-col bg-jewel-50/40">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-jewel-400/20 bg-jewel-100/40">
                                {selected ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-base font-semibold text-jewel-900">
                                                {selected === familyChat
                                                    ? t("chat.familyChat")
                                                    : selected.participants
                                                        ?.map((p) => p.name || p.id)
                                                        .join(", ")}
                                            </div>
                                            <div className="text-xs text-jewel-500 mt-1">
                                                {Object.entries(typingUsers).some(([, v]) => v)
                                                    ? t("chat.someoneTyping")
                                                    : t("chat.online")}
                                            </div>
                                        </div>
                                        <div className="text-xs text-jewel-500">
                                            {t("chat.messageCount", { count: messages.length })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-jewel-600 font-medium">
                                        {t("chat.selectConversation")}
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div
                                ref={containerRef}
                                className="flex-1 overflow-auto px-4 md:px-6 py-6 space-y-3"
                            >
                                {!selected ? (
                                    <div className="h-full flex items-center justify-center text-jewel-500">
                                        {t("chat.pickChat")}
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const isMe =
                                            m.senderId === (meId || "") ||
                                            (m.clientId && m.senderName === "You");

                                        return (
                                            <div
                                                key={m.id}
                                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`
                            max-w-[78%] md:max-w-[60%] rounded-3xl px-4 py-3 border
                            ${isMe
                                                            ? "bg-jewel-gold/10 border-jewel-gold/30 text-jewel-900"
                                                            : "bg-white/60 border-jewel-400/20 text-jewel-800"
                                                        }
                          `}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {!isMe && (
                                                            <div className="text-xs text-jewel-500 font-medium">
                                                                {m.senderName}
                                                            </div>
                                                        )}
                                                        {m.clientId && (
                                                            <div className="text-[11px] text-jewel-400">
                                                                {m.status === "sending"
                                                                    ? t("chat.sending")
                                                                    : m.status === "failed"
                                                                        ? t("chat.failed")
                                                                        : t("chat.sent")}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 text-[15px] leading-relaxed">
                                                        {m.content}
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-jewel-400">
                                                        <div>{new Date(m.createdAt).toLocaleString()}</div>
                                                        {m.clientId && m.status === "failed" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => retryMessage(m)}
                                                                className="text-xs px-2 py-0.5 text-jewel-ruby hover:text-jewel-ruby underline h-auto"
                                                            >
                                                                {t("chat.retry")}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Typing indicator */}
                            {selected && (
                                <div className="px-6 pb-2 text-xs text-jewel-400">
                                    {Object.entries(typingUsers)
                                        .filter(([, v]) => v)
                                        .map(([k]) => `${k} ${t("chat.typing")}`)
                                        .join(" ")}
                                </div>
                            )}

                            {/* Input */}
                            {selected && (
                                <div className="p-4 md:p-6 border-t border-jewel-400/20 bg-jewel-100/40">
                                    <div className="flex gap-3">
                                        <input
                                            value={input}
                                            onChange={(e) => onInputChange(e.target.value)}
                                            placeholder={t("chat.typeMessage")}
                                            className="flex-1 px-4 py-3 rounded-2xl bg-white/60 border border-jewel-400/30 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent transition-all"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") sendMessage();
                                            }}
                                        />
                                        <Button
                                            onClick={sendMessage}
                                        >
                                            {t("chat.send")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DreamySunsetBackground>
    );
}
