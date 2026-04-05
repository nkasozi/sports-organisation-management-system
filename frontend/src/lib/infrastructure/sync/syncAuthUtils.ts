import type { ConvexClient } from "./syncTypes";

export function is_auth_error(error_message: string | null): boolean {
  if (!error_message) return false;
  return (
    error_message.includes("authentication_required") ||
    error_message.includes("unauthorized") ||
    error_message.includes("Server rejected")
  );
}

export async function verify_sync_auth(
  convex_client: ConvexClient,
): Promise<{ authenticated: boolean; error: string | null }> {
  try {
    const result = (await convex_client.query("sync:check_auth", {})) as {
      authenticated: boolean;
    };
    return { authenticated: result.authenticated, error: null };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    return { authenticated: false, error: error_message };
  }
}
