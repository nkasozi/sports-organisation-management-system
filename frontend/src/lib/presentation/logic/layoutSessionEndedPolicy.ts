import type { AsyncResult, Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  DEVICE_SESSION_STATUS,
  type DeviceSessionState,
} from "$lib/presentation/stores/deviceSessionState";
import {
  SESSION_SYNC_NOTICE_KIND,
  type SessionSyncNoticeKind,
} from "$lib/presentation/stores/sessionSyncNotice";

export interface SessionEndedPolicyDependencies {
  resolve_current_device_session(): Promise<DeviceSessionState>;
  get_unsynced_local_change_count(): AsyncResult<number>;
  sign_out_and_tear_down_device(landing_path: string): AsyncResult<boolean>;
  lock_to_public_viewer(): Promise<unknown>;
  show_session_ended_notice(unsynced_change_count: number): boolean;
  show_session_notice(kind: SessionSyncNoticeKind): boolean;
}

export const SESSION_ENDED_OUTCOME = {
  TORN_DOWN: "torn_down",
  LOCKED_WITH_UNSYNCED_CHANGES: "locked_with_unsynced_changes",
  LOCKED_COUNT_UNAVAILABLE: "locked_count_unavailable",
  CONTINUED_OFFLINE: "continued_offline",
  NO_ACTION: "no_action",
} as const;

type SessionEndedOutcome =
  (typeof SESSION_ENDED_OUTCOME)[keyof typeof SESSION_ENDED_OUTCOME];

const SESSION_ENDED_DECISION = {
  TEAR_DOWN: "tear_down",
  KEEP_FOR_RESYNC: "keep_for_resync",
  KEEP_COUNT_UNAVAILABLE: "keep_count_unavailable",
} as const;

type SessionEndedDecision =
  | { status: typeof SESSION_ENDED_DECISION.TEAR_DOWN }
  | {
      status: typeof SESSION_ENDED_DECISION.KEEP_FOR_RESYNC;
      unsynced_change_count: number;
    }
  | {
      status: typeof SESSION_ENDED_DECISION.KEEP_COUNT_UNAVAILABLE;
      error: string;
    };

const SESSION_ENDED_LANDING_PATH = "/";
const SESSION_ENDED_EVENT = {
  DECIDED: "verified_session_ended_decided",
  TEARDOWN_FAILED: "verified_session_ended_teardown_failed",
  CONTINUED_OFFLINE: "verified_session_continued_offline",
} as const;

function decide_session_ended_action(
  count_result: Result<number>,
): SessionEndedDecision {
  if (!count_result.success)
    return {
      status: SESSION_ENDED_DECISION.KEEP_COUNT_UNAVAILABLE,
      error: count_result.error,
    };
  return count_result.data === 0
    ? { status: SESSION_ENDED_DECISION.TEAR_DOWN }
    : {
        status: SESSION_ENDED_DECISION.KEEP_FOR_RESYNC,
        unsynced_change_count: count_result.data,
      };
}

async function tear_down_ended_session(
  dependencies: SessionEndedPolicyDependencies,
): Promise<Result<SessionEndedOutcome>> {
  const teardown_result = await dependencies.sign_out_and_tear_down_device(
    SESSION_ENDED_LANDING_PATH,
  );
  if (teardown_result.success)
    return create_success_result(SESSION_ENDED_OUTCOME.TORN_DOWN);
  console.error("[Layout] Ended session could not be cleared", {
    event: SESSION_ENDED_EVENT.TEARDOWN_FAILED,
    error: teardown_result.error,
  });
  await dependencies.lock_to_public_viewer();
  dependencies.show_session_notice(
    SESSION_SYNC_NOTICE_KIND.SIGN_OUT_CLEANUP_FAILED,
  );
  return create_failure_result(teardown_result.error);
}

async function keep_changes_for_resync(
  dependencies: SessionEndedPolicyDependencies,
  unsynced_change_count: number,
): Promise<Result<SessionEndedOutcome>> {
  await dependencies.lock_to_public_viewer();
  dependencies.show_session_ended_notice(unsynced_change_count);
  return create_success_result(
    SESSION_ENDED_OUTCOME.LOCKED_WITH_UNSYNCED_CHANGES,
  );
}

async function keep_changes_without_count(
  dependencies: SessionEndedPolicyDependencies,
): Promise<Result<SessionEndedOutcome>> {
  await dependencies.lock_to_public_viewer();
  dependencies.show_session_notice(
    SESSION_SYNC_NOTICE_KIND.LOCAL_CHANGES_CHECK_FAILED,
  );
  return create_success_result(SESSION_ENDED_OUTCOME.LOCKED_COUNT_UNAVAILABLE);
}

export async function handle_ended_verified_session(
  dependencies: SessionEndedPolicyDependencies,
): Promise<Result<SessionEndedOutcome>> {
  const decision = decide_session_ended_action(
    await dependencies.get_unsynced_local_change_count(),
  );
  console.warn("[Layout] Signed-in session ended on this device", {
    event: SESSION_ENDED_EVENT.DECIDED,
    decision: decision.status,
  });
  switch (decision.status) {
    case SESSION_ENDED_DECISION.TEAR_DOWN:
      return tear_down_ended_session(dependencies);
    case SESSION_ENDED_DECISION.KEEP_FOR_RESYNC:
      return keep_changes_for_resync(
        dependencies,
        decision.unsynced_change_count,
      );
    case SESSION_ENDED_DECISION.KEEP_COUNT_UNAVAILABLE:
      return keep_changes_without_count(dependencies);
  }
}

export async function handle_device_session_after_sign_out(
  dependencies: SessionEndedPolicyDependencies,
): Promise<Result<SessionEndedOutcome>> {
  const device_session = await dependencies.resolve_current_device_session();
  switch (device_session.status) {
    case DEVICE_SESSION_STATUS.SESSION_ENDED:
      return handle_ended_verified_session(dependencies);
    case DEVICE_SESSION_STATUS.OFFLINE_VERIFIED:
      console.warn("[Layout] Sign-in service unreachable; staying offline", {
        event: SESSION_ENDED_EVENT.CONTINUED_OFFLINE,
      });
      return create_success_result(SESSION_ENDED_OUTCOME.CONTINUED_OFFLINE);
    case DEVICE_SESSION_STATUS.SIGNED_IN:
    case DEVICE_SESSION_STATUS.ANONYMOUS:
      return create_success_result(SESSION_ENDED_OUTCOME.NO_ACTION);
  }
}
