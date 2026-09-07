"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { AdminNotification, AdminNotificationType } from "@/types/notification";

/**
 * Synthesizes a soft, pleasant luxury chime using Web Audio API
 * Eliminates need for external MP3 audio assets
 */
function playAudioChime(type: AdminNotificationType) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (type === "ORDER_PAID") {
      // 3-tone ascending royal chime (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.5);
      });
    } else if (type === "SECURITY_ALERT" || type === "STOCK_LOW") {
      // 2-tone alert chime (A4 -> E4)
      const now = ctx.currentTime;
      const notes = [440, 329.63];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.4);
      });
    } else {
      // Subtle single soft pop chime (E5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Audio context may be blocked by browser autoplay policy before user gesture
  }
}

export function useAdminRealtime() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial mute preference
  useEffect(() => {
    try {
      const savedMute = localStorage.getItem("filayoruba_sound_muted") || localStorage.getItem("tradedge_sound_muted");
      if (savedMute === "true") {
        setIsMuted(true);
      }
    } catch {}
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("filayoruba_sound_muted", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      // Broadcast to other tabs
      broadcastChannelRef.current?.postMessage({ action: "mark_read", id });
    } catch {}
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      broadcastChannelRef.current?.postMessage({ action: "mark_all_read" });
    } catch {}
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await fetch("/api/admin/notifications", { method: "DELETE" });
      broadcastChannelRef.current?.postMessage({ action: "clear_all" });
    } catch {}
  }, []);

  // Handle incoming notification payload
  const handleIncomingNotification = useCallback(
    (notification: AdminNotification, fromBroadcast = false) => {
      // 1. Prepend to state
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev.slice(0, 99)];
      });
      setUnreadCount((prev) => prev + 1);

      // 2. Play audio chime (if not muted and not duplicate broadcast)
      if (!isMuted && !fromBroadcast) {
        playAudioChime(notification.type);
      }

      // 3. Dispatch native DOM event for specific pages to listen to
      window.dispatchEvent(
        new CustomEvent("filayoruba:admin-event", { detail: notification })
      );

      if (notification.type === "ORDER_PAID" || notification.type === "ORDER_STATUS" || notification.type === "ORDER_CREATED") {
        window.dispatchEvent(
          new CustomEvent("filayoruba:order-updated", { detail: notification })
        );
      }

      // 4. Show rich toast with action link
      if (!fromBroadcast) {
        if (notification.type === "ORDER_PAID") {
          toast.success(notification.title, {
            description: notification.message,
            duration: 7000,
            action: notification.link
              ? {
                  label: "View Order",
                  onClick: () => {
                    if (notification.link) window.location.href = notification.link;
                  },
                }
              : undefined,
          });
        } else if (notification.type === "STOCK_LOW") {
          toast.warning(notification.title, {
            description: notification.message,
            duration: 6000,
            action: notification.link
              ? {
                  label: "View Catalog",
                  onClick: () => {
                    if (notification.link) window.location.href = notification.link;
                  },
                }
              : undefined,
          });
        } else if (notification.type === "SECURITY_ALERT") {
          toast.error(notification.title, {
            description: notification.message,
            duration: 8000,
          });
        } else {
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        }
      }
    },
    [isMuted]
  );

  // Setup Server-Sent Events (SSE) stream & BroadcastChannel
  useEffect(() => {
    fetchNotifications();

    // 1. Setup Cross-Tab Broadcast Channel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("filayoruba_admin_sync");
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        if (event.data?.action === "notification" && event.data.notification) {
          handleIncomingNotification(event.data.notification, true);
        } else if (event.data?.action === "mark_all_read") {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          setUnreadCount(0);
        } else if (event.data?.action === "mark_read" && event.data.id) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === event.data.id ? { ...n, isRead: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else if (event.data?.action === "clear_all") {
          setNotifications([]);
          setUnreadCount(0);
        }
      };
    } catch {}

    // 2. Setup Server-Sent Events stream
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource("/api/admin/events/stream");
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        setIsConnected(true);
      });

      es.addEventListener("notification", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.notification) {
            handleIncomingNotification(payload.notification);
            bc?.postMessage({
              action: "notification",
              notification: payload.notification,
            });
          }
        } catch {}
      });

      es.addEventListener("ping", () => {
        setIsConnected(true);
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();

        // Reconnect after 4 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, 4000);
      };
    };

    connectSSE();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (bc) {
        bc.close();
      }
    };
  }, [fetchNotifications, handleIncomingNotification]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isMuted,
    toggleSound,
    markAsRead,
    markAllAsRead,
    clearAll,
    refetchNotifications: fetchNotifications,
  };
}
