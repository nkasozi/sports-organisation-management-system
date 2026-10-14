import type { ConvexClient } from "convex/browser";

import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

import { start_signed_in_realtime_sync } from "./appRealtimeSyncWiring";

const REALTIME_SESSION_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
} as const;

type RealtimeSessionStatus =
  (typeof REALTIME_SESSION_STATUS)[keyof typeof REALTIME_SESSION_STATUS];

const REALTIME_START_SKIPPED_EVENT = "realtime_sync_start_skipped";

let realtime_convex_client: Option<ConvexClient> = create_none_option();
let realtime_session_status: RealtimeSessionStatus =
  REALTIME_SESSION_STATUS.IDLE;

export function remember_realtime_convex_client(client: ConvexClient): boolean {
  realtime_convex_client = create_some_option(client);
  return true;
}

export function start_realtime_sync_when_signed_in(
  user_is_signed_in: boolean,
): boolean {
  if (realtime_session_status === REALTIME_SESSION_STATUS.RUNNING) return false;
  if (
    !user_is_signed_in ||
    realtime_convex_client.status !== OptionStatus.SOME
  ) {
    console.log("[AppInitializer] Real-time sync not started", {
      event: REALTIME_START_SKIPPED_EVENT,
      signed_in: user_is_signed_in,
      client_ready: realtime_convex_client.status === OptionStatus.SOME,
    });
    return false;
  }
  start_signed_in_realtime_sync(realtime_convex_client.value);
  realtime_session_status = REALTIME_SESSION_STATUS.RUNNING;
  return true;
}

export function forget_realtime_session(): boolean {
  realtime_convex_client = create_none_option();
  realtime_session_status = REALTIME_SESSION_STATUS.IDLE;
  return true;
}
