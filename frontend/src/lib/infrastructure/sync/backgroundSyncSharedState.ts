import {
  DependencyStatus,
  type SyncEngineConfiguration,
} from "./syncEngineRunExecutor";

export const DEBOUNCE_DELAY_MS = 3000;
export const DEFAULT_SCHEDULED_SYNC_INTERVAL_MS = 3_600_000;

export const sync_engine_configuration: SyncEngineConfiguration = {
  orchestrator: { status: DependencyStatus.UNCONFIGURED },
  restoration_handlers: { status: DependencyStatus.UNCONFIGURED },
  remote_subscriber: { status: DependencyStatus.UNCONFIGURED },
};
