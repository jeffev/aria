"use client";

import { useEffect } from "react";

// O service worker é o que torna o ARIA instalável e o que permite mostrar
// notificação no Android, onde `new Notification()` não existe.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, []);

  return null;
}
