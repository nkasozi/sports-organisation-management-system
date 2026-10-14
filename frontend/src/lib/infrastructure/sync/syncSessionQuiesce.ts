import {
  start_background_sync,
  stop_background_sync,
} from "./backgroundSyncService";
import { sync_in_flight_work } from "./syncInFlightWork";
import { sync_run_cancellation } from "./syncRunSignals";

export async function stop_background_sync_and_wait_for_idle(): Promise<number> {
  stop_background_sync();
  sync_run_cancellation.cancel_active_runs();
  const settled_count = await sync_in_flight_work.pause_and_wait_until_idle();
  console.log("[BackgroundSync] In-flight sync work settled", {
    event: "background_sync_quiesced",
    settled_count,
  });
  return settled_count;
}

export async function stop_background_sync_for_maintenance(): Promise<number> {
  stop_background_sync();
  sync_run_cancellation.cancel_active_runs();
  const settled_count =
    await sync_in_flight_work.enter_maintenance_and_wait_until_idle();
  console.log("[BackgroundSync] Sync held for data maintenance", {
    event: "background_sync_maintenance_started",
    settled_count,
  });
  return settled_count;
}

export function start_background_sync_and_resume(): boolean {
  sync_in_flight_work.resume();
  return start_background_sync();
}

export function resume_in_flight_sync_work(): boolean {
  return sync_in_flight_work.resume();
}
