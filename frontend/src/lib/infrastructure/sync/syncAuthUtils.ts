import type { ConvexClient } from "./syncTypes";

const AUTHENTICATED_STATUS = "authenticated";
const UNAUTHENTICATED_STATUS = "unauthenticated";
const AUTHENTICATION_REQUIRED_MESSAGE = "Convex client is not authenticated";

export function is_auth_error(error_message: string): boolean {
  if (error_message.length === 0) return false;
  return (
    error_message.includes("authentication_required") ||
    error_message.includes("unauthorized") ||
    error_message.includes("Server rejected")
  );
}

export async function verify_sync_auth(
  convex_client: ConvexClient,
): Promise<
  | { status: typeof AUTHENTICATED_STATUS }
  | { status: typeof UNAUTHENTICATED_STATUS; error: string }
> {
  try {
    const result = (await convex_client.query("sync:check_auth", {})) as {
      authenticated: boolean;
    };

    return result.authenticated
      ? { status: AUTHENTICATED_STATUS }
      : {
          status: UNAUTHENTICATED_STATUS,
          error: AUTHENTICATION_REQUIRED_MESSAGE,
        };
  } catch (error) {
    console.warn("[SyncAuth] Failed to perform operation", {
      event: "repository_perform_operation_failed",
      error: String(error),
    });
    const error_message =
      error instanceof Error ? error.message : String(error);

    return { status: UNAUTHENTICATED_STATUS, error: error_message };
  }
}
