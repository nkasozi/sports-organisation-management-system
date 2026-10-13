import { sync_engine_configuration } from "./backgroundSyncSharedState";
import { DependencyStatus } from "./syncEngineRunExecutor";

const RemoteSubscriptionPauseStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
} as const;

type RemoteSubscriptionPauseState =
  | { status: typeof RemoteSubscriptionPauseStatus.ACTIVE }
  | { status: typeof RemoteSubscriptionPauseStatus.PAUSED };

let pause_state: RemoteSubscriptionPauseState = {
  status: RemoteSubscriptionPauseStatus.ACTIVE,
};

function is_remote_subscription_running(): boolean {
  const subscriber = sync_engine_configuration.remote_subscriber;
  return (
    subscriber.status === DependencyStatus.CONFIGURED &&
    subscriber.value.is_running()
  );
}

export function pause_remote_change_subscriptions(): boolean {
  const handlers = sync_engine_configuration.restoration_handlers;
  if (pause_state.status === RemoteSubscriptionPauseStatus.PAUSED) return false;
  if (handlers.status !== DependencyStatus.CONFIGURED) return false;
  if (!is_remote_subscription_running()) return false;
  const stopped = handlers.value.stop_remote_sync();
  console.log("[BackgroundSync] Realtime pulls paused", {
    event: "remote_subscriptions_paused",
    succeeded: stopped.success,
  });
  if (stopped.success)
    pause_state = { status: RemoteSubscriptionPauseStatus.PAUSED };
  return stopped.success;
}

export function resume_remote_change_subscriptions(): boolean {
  const handlers = sync_engine_configuration.restoration_handlers;
  if (pause_state.status !== RemoteSubscriptionPauseStatus.PAUSED) return false;
  if (handlers.status !== DependencyStatus.CONFIGURED) return false;
  pause_state = { status: RemoteSubscriptionPauseStatus.ACTIVE };
  const started = handlers.value.start_remote_sync();
  if (!started.success)
    console.error("[BackgroundSync] Realtime pulls could not be resumed", {
      event: "remote_subscriptions_resume_failed",
      error: started.error,
    });
  return started.success;
}
