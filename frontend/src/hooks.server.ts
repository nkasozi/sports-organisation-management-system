import type { Handle } from "@sveltejs/kit";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' https://clerk.com https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com",
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.com https://clerk.com https://*.clerk.accounts.dev",
  "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

function security_headers(): Handle {
  return async ({ event, resolve }) => {
    const response = await resolve(event);

    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);

    return response;
  };
}

export const handle: Handle = security_headers();
