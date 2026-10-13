import type {
  RemoteChangeSubscriberPort,
  SyncOrchestratorPort,
  SyncRestorationHandlers,
} from "$lib/core/interfaces/ports";

import { sync_engine_configuration } from "./backgroundSyncSharedState";
import { DependencyStatus } from "./syncEngineRunExecutor";

export function configure_orchestrator(
  sync_orchestrator: SyncOrchestratorPort,
): boolean {
  sync_engine_configuration.orchestrator = {
    status: DependencyStatus.CONFIGURED,
    value: sync_orchestrator,
  };
  console.log("[BackgroundSync] Orchestrator configured", {
    event: "background_sync_orchestrator_configured",
  });
  return true;
}

export function configure_restoration_handlers(
  handlers: SyncRestorationHandlers,
): boolean {
  sync_engine_configuration.restoration_handlers = {
    status: DependencyStatus.CONFIGURED,
    value: handlers,
  };
  console.log("[BackgroundSync] Restoration handlers configured", {
    event: "background_sync_restoration_handlers_configured",
  });
  return true;
}

export function configure_remote_subscriber(
  subscriber: RemoteChangeSubscriberPort,
): boolean {
  sync_engine_configuration.remote_subscriber = {
    status: DependencyStatus.CONFIGURED,
    value: subscriber,
  };
  console.log("[BackgroundSync] Remote subscriber configured", {
    event: "background_sync_remote_subscriber_configured",
  });
  return true;
}
