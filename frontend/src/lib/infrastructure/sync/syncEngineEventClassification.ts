import {
  type SyncEngineEvent,
  SyncEngineEventType,
  SyncFollowUp,
  type SyncFollowUpValue,
} from "./syncEngineTypes";

export const LifecycleCommandKind = {
  START: "start",
  RESUME: "resume",
  STOP: "stop",
  SUSPEND: "suspend",
  NONE: "none",
} as const;

type LifecycleCommand =
  | { kind: typeof LifecycleCommandKind.START; is_online: boolean }
  | { kind: typeof LifecycleCommandKind.RESUME }
  | { kind: typeof LifecycleCommandKind.STOP }
  | { kind: typeof LifecycleCommandKind.SUSPEND }
  | { kind: typeof LifecycleCommandKind.NONE };

export function classify_lifecycle_event(
  event: SyncEngineEvent,
): LifecycleCommand {
  switch (event.type) {
    case SyncEngineEventType.START:
      return { kind: LifecycleCommandKind.START, is_online: event.is_online };
    case SyncEngineEventType.RESUME:
      return { kind: LifecycleCommandKind.RESUME };
    case SyncEngineEventType.STOP:
      return { kind: LifecycleCommandKind.STOP };
    case SyncEngineEventType.SUSPEND:
      return { kind: LifecycleCommandKind.SUSPEND };
    case SyncEngineEventType.LOCAL_CHANGE_RECORDED:
    case SyncEngineEventType.DEBOUNCE_ELAPSED:
    case SyncEngineEventType.PUSH_REQUESTED:
    case SyncEngineEventType.FULL_SYNC_REQUESTED:
    case SyncEngineEventType.RUN_SUCCEEDED:
    case SyncEngineEventType.RUN_FAILED:
    case SyncEngineEventType.RUN_SKIPPED:
    case SyncEngineEventType.RUN_DEFERRED:
    case SyncEngineEventType.RETRY_ELAPSED:
    case SyncEngineEventType.WENT_ONLINE:
    case SyncEngineEventType.WENT_OFFLINE:
      return { kind: LifecycleCommandKind.NONE };
  }
}

export function read_connectivity_change(
  event: SyncEngineEvent,
  current_is_online: boolean,
): boolean {
  switch (event.type) {
    case SyncEngineEventType.WENT_ONLINE:
      return true;
    case SyncEngineEventType.WENT_OFFLINE:
      return false;
    case SyncEngineEventType.START:
    case SyncEngineEventType.STOP:
    case SyncEngineEventType.SUSPEND:
    case SyncEngineEventType.RESUME:
    case SyncEngineEventType.LOCAL_CHANGE_RECORDED:
    case SyncEngineEventType.DEBOUNCE_ELAPSED:
    case SyncEngineEventType.PUSH_REQUESTED:
    case SyncEngineEventType.FULL_SYNC_REQUESTED:
    case SyncEngineEventType.RUN_SUCCEEDED:
    case SyncEngineEventType.RUN_FAILED:
    case SyncEngineEventType.RUN_SKIPPED:
    case SyncEngineEventType.RUN_DEFERRED:
    case SyncEngineEventType.RETRY_ELAPSED:
      return current_is_online;
  }
}

export function requested_follow_up(event: SyncEngineEvent): SyncFollowUpValue {
  switch (event.type) {
    case SyncEngineEventType.LOCAL_CHANGE_RECORDED:
    case SyncEngineEventType.PUSH_REQUESTED:
      return SyncFollowUp.PUSH;
    case SyncEngineEventType.FULL_SYNC_REQUESTED:
      return SyncFollowUp.FULL;
    case SyncEngineEventType.START:
    case SyncEngineEventType.STOP:
    case SyncEngineEventType.SUSPEND:
    case SyncEngineEventType.RESUME:
    case SyncEngineEventType.DEBOUNCE_ELAPSED:
    case SyncEngineEventType.RUN_SUCCEEDED:
    case SyncEngineEventType.RUN_FAILED:
    case SyncEngineEventType.RUN_SKIPPED:
    case SyncEngineEventType.RUN_DEFERRED:
    case SyncEngineEventType.RETRY_ELAPSED:
    case SyncEngineEventType.WENT_ONLINE:
    case SyncEngineEventType.WENT_OFFLINE:
      return SyncFollowUp.NONE;
  }
}
