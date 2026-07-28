"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/auth/turnstile-widget";
import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch, parseApiResponse } from "@/lib/api/client";
import { MINIMUM_PASSWORD_LENGTH } from "@/lib/auth/requests";
import { getPublicTurnstileSiteKey } from "@/lib/env";

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

export function AuthPanel({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { configured, nonce } = useAuth();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success">("error");
  const [isPending, setIsPending] = useState(false);
  const pageContent = content[mode];
  const siteKey = getPublicTurnstileSiteKey();
  const requiresCaptcha = mode !== "reset";

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

    if (
      (mode === "signup" || mode === "reset") &&
      password.length < MINIMUM_PASSWORD_LENGTH
    ) {
      setFeedback(
        `Password must contain at least ${MINIMUM_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    if (requiresCaptcha && !captchaToken) {
      setFeedback("Complete the bot verification before continuing.");
      return;
    }

    setIsPending(true);

    try {
      if (mode === "login") {
        const response = await apiFetch("/api/auth/login", {
          body: JSON.stringify({
            captchaToken,
            email,
            next: new URLSearchParams(window.location.search).get("next"),
            password,
          }),
          method: "POST",
        });
        const result = await parseApiResponse<{ redirectTo: string }>(
          response,
          "Authentication failed.",
        );
        if (result.error || !result.data) {
          throw new Error(result.error ?? "Authentication failed.");
        }
        router.replace(result.data.redirectTo);
        router.refresh();
      } else if (mode === "signup") {
        const response = await apiFetch("/api/auth/signup", {
          body: JSON.stringify({ captchaToken, displayName, email, password }),
          method: "POST",
        });
        const result = await parseApiResponse<{ message: string }>(
          response,
          "Registration could not be completed.",
        );
        if (result.error || !result.data) {
          throw new Error(result.error ?? "Registration could not be completed.");
        }
        setFeedbackTone("success");
        setFeedback(result.data.message);
      } else if (mode === "forgot") {
        const response = await apiFetch("/api/auth/recovery", {
          body: JSON.stringify({ captchaToken, email }),
          method: "POST",
        });
        const result = await parseApiResponse<{ message: string }>(
          response,
          "Recovery could not be started.",
        );
        if (result.error || !result.data) {
          throw new Error(result.error ?? "Recovery could not be started.");
        }
        setFeedbackTone("success");
        setFeedback(result.data.message);
      } else {
        const response = await apiFetch("/api/auth/password", {
          body: JSON.stringify({ password }),
          method: "POST",
        });
        const result = await parseApiResponse<{ updated: boolean }>(
          response,
          "Password update failed.",
        );
        if (result.error) throw new Error(result.error);
        router.replace("/login?message=password-updated");
        router.refresh();
      }
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(error instanceof Error ? error.message : "Authentication request failed.");
    } finally {
      if (requiresCaptcha) turnstileRef.current?.reset();
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
              minLength={mode === "login" ? 1 : MINIMUM_PASSWORD_LENGTH}
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
              minLength={MINIMUM_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className={inputClassName}
              placeholder="••••••••"
            />
          </label>
        ) : null}

        {requiresCaptcha && siteKey ? (
          <TurnstileWidget
            ref={turnstileRef}
            nonce={nonce}
            siteKey={siteKey}
            onTokenChange={setCaptchaToken}
          />
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
          disabled={
            isPending ||
            !configured ||
            (requiresCaptcha && (!siteKey || !captchaToken))
          }
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
