import { randomBytes } from "node:crypto";

type ContentSecurityPolicyOptions = {
  development?: boolean;
  supabaseUrl?: string;
};

function getOrigin(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export function createContentSecurityPolicyNonce() {
  return randomBytes(16).toString("base64");
}

export function buildContentSecurityPolicy(
  nonce: string,
  options: ContentSecurityPolicyOptions = {},
) {
  const supabaseOrigin = getOrigin(options.supabaseUrl);
  const connectSources = [
    "'self'",
    "https://challenges.cloudflare.com",
    ...(supabaseOrigin ? [supabaseOrigin] : []),
  ];
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https://challenges.cloudflare.com",
    ...(options.development ? ["'unsafe-eval'"] : []),
  ];
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'none'",
    ...(options.development ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

export function applyResponseSecurityHeaders(
  headers: Headers,
  contentSecurityPolicy: string,
) {
  headers.set("Content-Security-Policy", contentSecurityPolicy);
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );

  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}
