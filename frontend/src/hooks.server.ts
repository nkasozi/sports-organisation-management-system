import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

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

async function get_clerk_handler(): Promise<Handle> {
  try {
    const { withClerkHandler } = await import("svelte-clerk/server");
    return withClerkHandler();
  } catch {
    return async ({ event, resolve }) => resolve(event);
  }
}

let clerk_handler_promise: Promise<Handle> | null = null;

function get_cached_clerk_handler(): Promise<Handle> {
  if (!clerk_handler_promise) {
    clerk_handler_promise = get_clerk_handler();
  }
  return clerk_handler_promise;
}

const clerk_handle: Handle = async ({ event, resolve }) => {
  const handler = await get_cached_clerk_handler();
  return handler({ event, resolve });
};

export const handle: Handle = sequence(clerk_handle, security_headers());
