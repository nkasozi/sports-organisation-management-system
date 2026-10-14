import { get } from "svelte/store";

import {
  clerk_session,
  get_clerk_reachability,
  initialize_clerk,
} from "$lib/adapters/iam/clerkAuthService";
import {
  CLERK_REACHABILITY_STATUS,
  type ClerkReachability,
} from "$lib/adapters/iam/clerkReachability";

import {
  classify_device_session,
  type DeviceSessionState,
} from "./deviceSessionState";
import { resolve_session_identity } from "./sessionIdentityResolution";
import { read_session_sync_state_from_storage } from "./sessionSyncMarker";

async function settle_clerk_reachability(): Promise<ClerkReachability> {
  const current_reachability = get_clerk_reachability();
  if (current_reachability.status !== CLERK_REACHABILITY_STATUS.PENDING)
    return current_reachability;
  await initialize_clerk();
  return get_clerk_reachability();
}

export async function resolve_current_device_session(): Promise<DeviceSessionState> {
  const clerk_reachability = await settle_clerk_reachability();

  return classify_device_session(
    resolve_session_identity(clerk_reachability, get(clerk_session)),
    await read_session_sync_state_from_storage(),
  );
}
