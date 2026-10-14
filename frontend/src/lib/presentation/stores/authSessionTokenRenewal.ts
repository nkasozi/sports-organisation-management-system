import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { AuthState } from "./authTypes";

export const LOCAL_TOKEN_RENEWAL_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const LOCAL_TOKEN_RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface LocalTokenRenewalPorts {
  read_auth_state(): AuthState;
  now(): number;
  renew_verified_session(): Promise<unknown>;
}

const LOCAL_TOKEN_RENEWAL_EVENT = "local_auth_token_renewed";

function is_renewal_due(state: AuthState, now_ms: number): boolean {
  if (state.is_demo_session) return false;
  if (state.current_token.status !== PRESENCE_STATUS.PRESENT) return false;
  const expires_at = state.current_token.token.payload.expires_at;
  return expires_at - now_ms <= LOCAL_TOKEN_RENEWAL_WINDOW_MS;
}

export async function renew_local_token_if_due(
  ports: LocalTokenRenewalPorts,
): Promise<boolean> {
  if (!is_renewal_due(ports.read_auth_state(), ports.now())) return false;
  await ports.renew_verified_session();
  console.log("[AuthStore] Local sign-in token renewed before expiry", {
    event: LOCAL_TOKEN_RENEWAL_EVENT,
  });
  return true;
}

export function start_local_token_renewal(
  ports: LocalTokenRenewalPorts,
): () => void {
  const interval_id = setInterval(() => {
    void renew_local_token_if_due(ports);
  }, LOCAL_TOKEN_RENEWAL_CHECK_INTERVAL_MS);
  return () => clearInterval(interval_id);
}
