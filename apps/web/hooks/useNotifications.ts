import { useEffect, useRef, useState, useCallback } from "react";

import { API_BASE } from "../lib/config";
import apiFetch from "../lib/api";

type Notification = {
  id?: string;
  previewId?: string;
  type?: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

export type UseNotificationsHook = {
  unreadCount: number;
  notifications: Notification[];
  refresh: () => Promise<void>;
  markRead: (notificationId: string, currentRead: boolean) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
  pulse: boolean;
};

/**
 * Performs use notifications operation.
 * @returns {import("/Users/nalindalal/modheshwari/apps/web/hooks/useNotifications").UseNotificationsHook} Description of return value
 */
export default function useNotifications(): UseNotificationsHook {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pulse, setPulse] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const mergePersisted = (prev: Notification[], fetched: Notification[]) => {
    const next = [...fetched];
    const fetchedKeys = new Set(
      next.map((n) =>
        n.id
          ? `id:${n.id}`
          : n.previewId
            ? `preview:${n.previewId}`
            : `fallback:${n.message}:${n.createdAt}`,
      ),
    );
    const fetchedPreviewIds = new Set(
      next.map((n) => n.previewId).filter(Boolean),
    );

    for (const p of prev) {
      if (p.previewId && fetchedPreviewIds.has(p.previewId)) continue;
      const key = p.id
        ? `id:${p.id}`
        : p.previewId
          ? `preview:${p.previewId}`
          : `fallback:${p.message}:${p.createdAt}`;
      if (fetchedKeys.has(key)) continue;
      next.unshift(p);
    }

    return next;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      const js = await apiFetch(`${API_BASE}/notifications`);
      const fetched: Notification[] = js?.data?.notifications ?? [];
      setNotifications((prev) => mergePersisted(prev, fetched));
      setUnreadCount(fetched.filter((n) => !n.read).length);
    } catch {
      // error handled by caller
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const connectWs = () => {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      // In dev, Vite runs on 3000 and WS server on 3001.
      // In production, both are on the same host.
      const wsHost = import.meta.env.DEV
        ? `${window.location.hostname}:3001`
        : window.location.host;
      const wsUrl = `${proto}://${wsHost}`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        return;
      }
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        reconnectAttempts.current = 0;
        try {
          ws.send(JSON.stringify({ type: "auth", token }));
        } catch {
          // ignore
        }
      });

      ws.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === "notification") {
            const incoming: Notification = data.notification;
            setNotifications((prev) => [incoming, ...prev]);
            setUnreadCount((c) => c + 1);
            setPulse(true);
            setTimeout(() => setPulse(false), 700);
          }
          if (data?.type === "notification_read") {
            void fetchNotifications();
          }
        } catch {
          // ignore parse errors
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
    };

    connectWs();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [fetchNotifications]);

  async function markRead(notificationId: string, currentRead: boolean) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return false;
    try {
      await apiFetch(`${API_BASE}/notifications/${notificationId}`, {
        method: "PATCH",
        body: JSON.stringify({ read: !currentRead }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: !currentRead } : n,
        ),
      );
      if (!currentRead) setUnreadCount((c) => Math.max(0, c - 1));
      else setUnreadCount((c) => c + 1);

      return true;
    } catch (err) {
      console.error("Failed to mark notification read", err);
      return false;
    }
  }

  async function markAllRead() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return false;
    try {
      await apiFetch(`${API_BASE}/notifications/read-all`, { method: "POST" });
      await fetchNotifications();
      return true;
    } catch (err) {
      console.error("Failed to mark all read", err);
      return false;
    }
  }

  return {
    unreadCount,
    notifications,
    refresh: fetchNotifications,
    markRead,
    markAllRead,
    pulse,
  };
}
