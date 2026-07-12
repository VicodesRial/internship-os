"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "forgot" | "login" | "reset" | "signup";

const content: Record<AuthMode, { eyebrow: string; title: string; description: string }> = {
  forgot: {
    eyebrow: "RECOVERY_CHANNEL",
    title: "Reset access",
    description: "Transmit a secure recovery link to your account email.",
  },
  login: {
    eyebrow: "AUTH_GATEWAY",
    title: "Operator login",
    description: "Authenticate to access your private internship command center.",
  },
  reset: {
    eyebrow: "CREDENTIAL_RESET",
    title: "Set new password",
    description: "Replace the password for your authenticated recovery session.",
  },
  signup: {
    eyebrow: "OPERATOR_REGISTRATION",
    title: "Create account",
    description: "Register a private workspace that synchronizes across devices.",
  },
};

const inputClassName =
  "mt-2 w-full rounded-sm border border-[var(--border)] bg-[#090f16] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[#586679] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

function getInitialMessage() {
  const params = new URLSearchParams(window.location.search);
  const message = params.get("message");
  const error = params.get("error");

  if (error === "confirmation-failed") return "The confirmation link is invalid or expired.";
  if (error === "callback-failed") return "The authentication callback could not be completed.";
  if (error === "configuration") return "Supabase environment variables are not configured.";
  if (error === "recovery-required") return "Request a recovery link before setting a new password.";
  if (message === "signed-out") return "Session closed successfully.";
  if (message === "password-updated") return "Password updated. Sign in with your new credentials.";
  return null;
}

function getSafeNextPath() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function AuthPanel({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { configured } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success">("error");
  const [isPending, setIsPending] = useState(false);
  const pageContent = content[mode];

  useEffect(() => {
    const initialMessage = getInitialMessage();
    if (initialMessage) {
      if (new URLSearchParams(window.location.search).has("message")) {
        setFeedbackTone("success");
      }
      setFeedback(initialMessage);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!configured) {
      setFeedback("Supabase environment variables are not configured.");
      return;
    }

    if ((mode === "signup" || mode === "reset") && password !== confirmPassword) {
      setFeedback("Passwords do not match.");
      return;
    }

    if ((mode === "signup" || mode === "reset") && password.length < 8) {
      setFeedback("Password must contain at least 8 characters.");
      return;
    }

    setIsPending(true);
    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(getSafeNextPath());
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          },
        });
        if (error) throw error;

        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setFeedbackTone("success");
          setFeedback("Account created. Check your email to confirm access.");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setFeedbackTone("success");
        setFeedback("Recovery link transmitted. Check your email.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        router.replace("/login?message=password-updated");
        router.refresh();
      }
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(error instanceof Error ? error.message : "Authentication request failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="command-panel w-full max-w-md p-5 sm:p-6">
      <div className="border-b border-[var(--border)] pb-4">
        <p className="command-label">{pageContent.eyebrow}</p>
        <h1 className="font-pixel-display mt-2 text-lg uppercase text-[var(--text)]">
          {pageContent.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{pageContent.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {mode === "signup" ? (
          <label className="block text-sm font-medium text-[var(--text)]">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              className={inputClassName}
              placeholder="Vicente"
            />
          </label>
        ) : null}

        {mode !== "reset" ? (
          <label className="block text-sm font-medium text-[var(--text)]">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className={inputClassName}
              placeholder="operator@example.com"
            />
          </label>
        ) : null}

        {mode !== "forgot" ? (
          <label className="block text-sm font-medium text-[var(--text)]">
            {mode === "reset" ? "New password" : "Password"}
            <input
              required
              type="password"
              minLength={mode === "login" ? 6 : 8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputClassName}
              placeholder="••••••••"
            />
          </label>
        ) : null}

        {mode === "signup" || mode === "reset" ? (
          <label className="block text-sm font-medium text-[var(--text)]">
            Confirm password
            <input
              required
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className={inputClassName}
              placeholder="••••••••"
            />
          </label>
        ) : null}

        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-sm border px-3 py-2.5 text-xs leading-5 ${
              feedbackTone === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-rose-400/30 bg-rose-400/10 text-rose-300"
            }`}
          >
            {feedback}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !configured}
          className="command-button w-full border-[var(--accent)] bg-[#234e78] text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Processing"
            : mode === "login"
              ? "Authenticate"
              : mode === "signup"
                ? "Create operator"
                : mode === "forgot"
                  ? "Send recovery link"
                  : "Update password"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
        {mode === "login" ? <Link href="/forgot-password">Forgot password?</Link> : null}
        {mode === "login" ? <Link href="/signup">Create account</Link> : null}
        {mode === "signup" || mode === "forgot" ? <Link href="/login">Return to login</Link> : null}
      </div>
    </section>
  );
}
