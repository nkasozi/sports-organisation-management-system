import type { Handle } from "@sveltejs/kit";

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

    return response;
  };
}

export const handle: Handle = security_headers();
