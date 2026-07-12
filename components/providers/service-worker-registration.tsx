"use client";

import { useEffect } from "react";

function canRegisterServiceWorker() {
  if (typeof window === "undefined") {
    return false;
  }

  if (!("serviceWorker" in navigator)) {
    return false;
  }

  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!canRegisterServiceWorker()) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  return null;
}
