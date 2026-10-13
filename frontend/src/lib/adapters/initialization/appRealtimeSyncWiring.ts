import type { ConvexClient } from "convex/browser";

import { api } from "$convex/_generated/api";
import type { SubscribableConvexClient } from "$lib/infrastructure/cache/AuthCacheInvalidator";
import { get_organization_settings_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
import {
  configure_orchestrator,
  configure_remote_subscriber,
  configure_restoration_handlers,
  configure_scheduled_interval,
} from "$lib/infrastructure/sync/backgroundSyncService";
import {
  get_realtime_sync_adapter,
  start_realtime_sync,
} from "$lib/infrastructure/sync/convexRealtimeSync";
import { branding_store } from "$lib/presentation/stores/branding";
import { sync_store } from "$lib/presentation/stores/syncStore";

const ORGANIZATION_SETTINGS_TABLE_NAME = "organization_settings";
const SCOPED_ORGANIZATION_CONTEXT_STATUS = "scoped";

const REALTIME_WIRING_EVENT = {
  SYNC_PORTS_WIRED: "sync_ports_wired",
  SUBSCRIPTIONS_STARTED: "realtime_sync_subscriptions_started",
  ORGANIZATION_SETTINGS_REFRESHED: "realtime_organization_settings_refreshed",
  ORGANIZATION_SETTINGS_REFRESH_FAILED:
    "realtime_organization_settings_refresh_failed",
  SYNC_INTERVAL_REJECTED: "realtime_sync_interval_rejected",
} as const;

function log_settings_refresh_failure(
  organization_id: string,
  error: string,
): boolean {
  console.error("[AppInitializer] Pulled organization settings not applied", {
    event: REALTIME_WIRING_EVENT.ORGANIZATION_SETTINGS_REFRESH_FAILED,
    organization_id,
    error,
  });
  return false;
}

async function refresh_scoped_organization_settings(
  organization_id: string,
): Promise<boolean> {
  const settings_result =
    await get_organization_settings_use_cases().get_by_organization_id(
      organization_id,
    );
  if (!settings_result.success)
    return log_settings_refresh_failure(organization_id, settings_result.error);
  if (!settings_result.data) return false;
  branding_store.refresh_from_organization_settings(settings_result.data);
  const interval_result = configure_scheduled_interval(
    settings_result.data.sync_interval_ms,
  );
  if (!interval_result.success)
    console.warn("[AppInitializer] Pulled sync interval rejected", {
      event: REALTIME_WIRING_EVENT.SYNC_INTERVAL_REJECTED,
      organization_id,
      error: interval_result.error,
    });
  console.log("[AppInitializer] Pulled organization settings applied", {
    event: REALTIME_WIRING_EVENT.ORGANIZATION_SETTINGS_REFRESHED,
    organization_id,
  });
  return interval_result.success;
}

function handle_pulled_organization_settings(table_name: string): boolean {
  if (table_name !== ORGANIZATION_SETTINGS_TABLE_NAME) return false;
  const organization_context_state = branding_store.get_current_org_id_state();
  if (organization_context_state.status !== SCOPED_ORGANIZATION_CONTEXT_STATUS)
    return false;
  const organization_id = String(organization_context_state.organization_id);
  refresh_scoped_organization_settings(organization_id).catch(
    (error: unknown) =>
      log_settings_refresh_failure(organization_id, String(error)),
  );
  return true;
}

function wire_sync_ports(): boolean {
  const realtime_adapter = get_realtime_sync_adapter();
  configure_orchestrator(sync_store.get_sync_orchestrator());
  configure_remote_subscriber(realtime_adapter);
  configure_restoration_handlers({
    stop_remote_sync: () => realtime_adapter.stop(),
    start_remote_sync: () => realtime_adapter.start(),
  });
  console.log("[AppInitializer] Sync ports wired", {
    event: REALTIME_WIRING_EVENT.SYNC_PORTS_WIRED,
  });
  return true;
}

export function start_signed_in_realtime_sync(
  convex_client: ConvexClient,
): boolean {
  start_realtime_sync(
    convex_client as unknown as SubscribableConvexClient,
    {
      mutation: (name: string, args: Record<string, unknown>) =>
        convex_client.mutation(name as never, args as never),
      query: (name: string, args: Record<string, unknown>) =>
        convex_client.query(name as never, args as never),
    },
    api.sync.get_table_change_marker,
    handle_pulled_organization_settings,
  );
  console.log("[AppInitializer] Real-time sync started", {
    event: REALTIME_WIRING_EVENT.SUBSCRIPTIONS_STARTED,
  });
  return wire_sync_ports();
}
