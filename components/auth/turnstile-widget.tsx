"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TurnstileApi = {
  remove(widgetId: string): void;
  render(
    container: HTMLElement,
    options: {
      "error-callback": () => void;
      "expired-callback": () => void;
      callback: (token: string) => void;
      sitekey: string;
      size: "flexible";
      theme: "dark";
    },
  ): string;
  reset(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileWidgetHandle = {
  reset(): void;
};

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  {
    nonce?: string;
    onTokenChange(token: string | null): void;
    siteKey: string;
  }
>(function TurnstileWidget({ nonce, onTokenChange, siteKey }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (window.turnstile) setScriptReady(true);
  }, []);

  useEffect(() => {
    const turnstile = window.turnstile;
    const container = containerRef.current;
    if (!scriptReady || !turnstile || !container || widgetIdRef.current) return;

    widgetIdRef.current = turnstile.render(container, {
      sitekey: siteKey,
      size: "flexible",
      theme: "dark",
      callback: (token) => onTokenChange(token),
      "error-callback": () => onTokenChange(null),
      "expired-callback": () => onTokenChange(null),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onTokenChange, scriptReady, siteKey]);

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenChange(null);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }), [onTokenChange]);

  return (
    <>
      <Script
        nonce={nonce}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setLoadFailed(true)}
      />
      <div
        ref={containerRef}
        aria-label="Bot verification"
        className="min-h-[65px] w-full"
      />
      {loadFailed ? (
        <p role="alert" className="text-xs leading-5 text-rose-300">
          Bot verification could not load. Check content blockers and retry.
        </p>
      ) : null}
    </>
  );
});
