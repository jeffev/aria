"use client";

import { useEffect, useRef } from "react";

const ALERT_MINUTES = 15;
const CHECK_INTERVAL_MS = 60_000;

export default function EventNotifications() {
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!("Notification" in window)) return;

    async function requestAndCheck() {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") return;
      checkUpcomingEvents();
    }

    requestAndCheck();
    const interval = setInterval(checkUpcomingEvents, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  async function checkUpcomingEvents() {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const windowEnd = new Date(now.getTime() + ALERT_MINUTES * 60_000 + CHECK_INTERVAL_MS);

    const res = await fetch(`/api/agenda?from=${now.toISOString()}&to=${windowEnd.toISOString()}`);
    const events: Array<{ id: string; title: string; startAt: string; allDay: boolean }> = await res.json();

    for (const ev of events) {
      if (ev.allDay || notifiedIds.current.has(ev.id)) continue;

      const start = new Date(ev.startAt);
      const minsUntil = Math.round((start.getTime() - now.getTime()) / 60_000);

      if (minsUntil >= 0 && minsUntil <= ALERT_MINUTES) {
        notifiedIds.current.add(ev.id);
        new Notification(`🔔 Em ${minsUntil} min: ${ev.title}`, {
          body: `Início: ${start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          icon: "/favicon.ico",
          tag: ev.id,
        });
      }
    }
  }

  return null;
}
