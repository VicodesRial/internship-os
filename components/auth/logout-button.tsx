"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    const response = await apiFetch("/api/auth/logout", {
      body: "{}",
      method: "POST",
    });
    setIsPending(false);

    if (response.ok) {
      router.replace("/login?message=signed-out");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="font-pixel-label rounded-sm border border-[var(--border)] px-2 py-1 text-[7px] uppercase text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
    >
      {isPending ? "Closing" : "Sign out"}
    </button>
  );
}
