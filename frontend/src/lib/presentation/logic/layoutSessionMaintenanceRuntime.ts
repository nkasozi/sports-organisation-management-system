import { get } from "svelte/store";

import {
  clerk_session,
  get_clerk,
  get_clerk_reachability,
  is_signed_in,
  retry_clerk_initialization,
} from "$lib/adapters/iam/clerkAuthService";
import { read_browser_network_online } from "$lib/adapters/iam/clerkReachability";
import { start_realtime_sync_for_signed_in_session } from "$lib/adapters/initialization/appInitializer";
import { auth_store } from "$lib/presentation/stores/auth";
import { clear_saved_token } from "$lib/presentation/stores/authSessionStorage";
import { start_local_token_renewal } from "$lib/presentation/stores/authSessionTokenRenewal";

import {
  create_clerk_confirmation_tracker,
  reconnect_device_session,
  type SessionReconnectPorts,
  should_retry_clerk_in_background,
} from "./layoutSessionReconnect";
import {
  complete_root_layout_pending_clerk_sign_out,
  handle_root_layout_user_signed_out,
} from "./layoutSessionTransitionRuntime";

const ONLINE_EVENT_NAME = "online";
const CLERK_BACKGROUND_RETRY_INTERVAL_MS = 30_000;
const SESSION_RECONNECT_FAILED_EVENT = "device_session_reconnect_failed";
const TOKEN_RENEWAL_FAILED_EVENT = "local_auth_token_renewal_failed";

function create_single_flight_check(
  check: () => Promise<unknown>,
): () => Promise<boolean> {
  const check_state = { is_running: false };
  return async (): Promise<boolean> => {
    if (check_state.is_running) return false;
    check_state.is_running = true;
    await check().finally(() => {
      check_state.is_running = false;
    });
    return true;
  };
}

function create_reconnect_ports(): SessionReconnectPorts {
  return {
    is_browser_online: read_browser_network_online,
    is_clerk_ready: () => get_clerk().success,
    complete_pending_clerk_sign_out:
      complete_root_layout_pending_clerk_sign_out,
    retry_clerk_initialization,
    is_signed_in: () => get(is_signed_in),
    ensure_signed_in_sync: start_realtime_sync_for_signed_in_session,
    check_signed_out_device: create_single_flight_check(
      handle_root_layout_user_signed_out,
    ),
  };
}

async function renew_verified_session(): Promise<boolean> {
  await clear_saved_token();
  auth_store.reset_initialized_state();
  const initialize_result = await auth_store.initialize();
  if (initialize_result.success) return true;
  console.error("[Layout] Sign-in token could not be renewed", {
    event: TOKEN_RENEWAL_FAILED_EVENT,
    error: initialize_result.error,
  });
  return false;
}

function create_single_flight_reconnect(
  ports: SessionReconnectPorts,
): () => boolean {
  const reconnect_state = { is_running: false };
  return (): boolean => {
    if (reconnect_state.is_running) return false;
    reconnect_state.is_running = true;
    reconnect_device_session(ports)
      .catch((error: unknown) =>
        console.error("[Layout] Session reconnect failed", {
          event: SESSION_RECONNECT_FAILED_EVENT,
          error: String(error),
        }),
      )
      .finally(() => {
        reconnect_state.is_running = false;
      });
    return true;
  };
}

function watch_clerk_confirmation(ports: SessionReconnectPorts): () => void {
  const tracker = create_clerk_confirmation_tracker(
    get_clerk_reachability().status,
  );
  return clerk_session.subscribe((clerk_state) => {
    if (!tracker.has_just_confirmed(get_clerk_reachability().status)) return;
    if (clerk_state.is_signed_in) return;
    void ports.check_signed_out_device();
  });
}

export function start_root_layout_session_maintenance(): () => void {
  const ports = create_reconnect_ports();
  const reconnect = create_single_flight_reconnect(ports);
  const handle_online = (): void => {
    reconnect();
  };
  window.addEventListener(ONLINE_EVENT_NAME, handle_online);
  const retry_interval_id = setInterval(() => {
    if (should_retry_clerk_in_background(ports)) reconnect();
  }, CLERK_BACKGROUND_RETRY_INTERVAL_MS);
  const stop_confirmation_watch = watch_clerk_confirmation(ports);
  const stop_token_renewal = start_local_token_renewal({
    read_auth_state: () => get(auth_store),
    now: () => Date.now(),
    renew_verified_session,
  });
  return () => {
    window.removeEventListener(ONLINE_EVENT_NAME, handle_online);
    clearInterval(retry_interval_id);
    stop_token_renewal();
    stop_confirmation_watch();
  };
}
