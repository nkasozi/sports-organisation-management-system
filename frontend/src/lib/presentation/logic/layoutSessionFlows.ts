import type { AsyncResult, Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  SESSION_SYNC_NOTICE_KIND,
  type SessionSyncNoticeKind,
} from "$lib/presentation/stores/sessionSyncNotice";

import type { AuthStorePort } from "./layoutLoginSync";
import {
  LAYOUT_SESSION_EVENT,
  LAYOUT_SESSION_MESSAGE,
  LAYOUT_SESSION_PROGRESS,
} from "./layoutSessionConstants";

interface AnonymousInitialSyncStorePort {
  start_sync(): void;
  update_progress(message: string, percentage: number): void;
  complete_sync(): AsyncResult<boolean>;
  reset(): void;
}

interface ReturningAnonymousSessionDependencies {
  auth_store: AuthStorePort;
  start_background_sync(): boolean;
}

interface FirstTimeAnonymousSessionDependencies extends ReturningAnonymousSessionDependencies {
  initial_sync_store: AnonymousInitialSyncStorePort;
  reset_all_data(
    progress_callback: (message: string, percentage: number) => void,
  ): Promise<unknown>;
  get_unsynced_local_change_count(): AsyncResult<number>;
  show_session_notice(kind: SessionSyncNoticeKind): boolean;
}

const FIRST_TIME_RESET_DECISION = {
  RESET_ALLOWED: "reset_allowed",
  BLOCKED_UNSYNCED_CHANGES: "blocked_unsynced_changes",
  BLOCKED_COUNT_UNAVAILABLE: "blocked_count_unavailable",
} as const;

type FirstTimeResetDecision =
  | { status: typeof FIRST_TIME_RESET_DECISION.RESET_ALLOWED }
  | {
      status: typeof FIRST_TIME_RESET_DECISION.BLOCKED_UNSYNCED_CHANGES;
      unsynced_count: number;
    }
  | {
      status: typeof FIRST_TIME_RESET_DECISION.BLOCKED_COUNT_UNAVAILABLE;
      error: string;
    };

type BlockedFirstTimeResetDecision = Exclude<
  FirstTimeResetDecision,
  { status: typeof FIRST_TIME_RESET_DECISION.RESET_ALLOWED }
>;

async function decide_first_time_anonymous_reset(
  dependencies: FirstTimeAnonymousSessionDependencies,
): Promise<FirstTimeResetDecision> {
  const count_result = await dependencies.get_unsynced_local_change_count();
  if (!count_result.success)
    return {
      status: FIRST_TIME_RESET_DECISION.BLOCKED_COUNT_UNAVAILABLE,
      error: count_result.error,
    };
  return count_result.data === 0
    ? { status: FIRST_TIME_RESET_DECISION.RESET_ALLOWED }
    : {
        status: FIRST_TIME_RESET_DECISION.BLOCKED_UNSYNCED_CHANGES,
        unsynced_count: count_result.data,
      };
}

function resolve_blocked_reset_notice(
  decision: BlockedFirstTimeResetDecision,
): SessionSyncNoticeKind {
  switch (decision.status) {
    case FIRST_TIME_RESET_DECISION.BLOCKED_UNSYNCED_CHANGES:
      return SESSION_SYNC_NOTICE_KIND.LOCAL_CHANGES_PROTECTED;
    case FIRST_TIME_RESET_DECISION.BLOCKED_COUNT_UNAVAILABLE:
      return SESSION_SYNC_NOTICE_KIND.LOCAL_CHANGES_CHECK_FAILED;
  }
}

async function keep_local_data_for_blocked_first_time_session(
  dependencies: FirstTimeAnonymousSessionDependencies,
  decision: BlockedFirstTimeResetDecision,
): Promise<Result<boolean>> {
  console.warn("[Layout] First-time anonymous reset blocked", {
    event: LAYOUT_SESSION_EVENT.ANONYMOUS_FIRST_TIME_RESET_BLOCKED,
    decision_status: decision.status,
  });
  dependencies.initial_sync_store.reset();
  dependencies.show_session_notice(resolve_blocked_reset_notice(decision));
  const returning_session_result =
    await handle_returning_anonymous_user_session(dependencies);
  if (!returning_session_result.success) {
    console.error(
      "[Layout] Returning anonymous session failed after blocked reset",
      {
        event:
          LAYOUT_SESSION_EVENT.ANONYMOUS_BLOCKED_RESET_RETURNING_SESSION_FAILED,
        error: returning_session_result.error,
      },
    );
  }
  return create_failure_result(LAYOUT_SESSION_MESSAGE.FIRST_TIME_RESET_BLOCKED);
}

async function reset_and_initialize_first_time_session(
  dependencies: FirstTimeAnonymousSessionDependencies,
): Promise<Result<boolean>> {
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.LOADING_OFFLINE_DATA.message,
    LAYOUT_SESSION_PROGRESS.LOADING_OFFLINE_DATA.percentage,
  );
  await dependencies.reset_all_data((message: string, percentage: number) =>
    dependencies.initial_sync_store.update_progress(message, percentage),
  );
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.SETTING_UP_PROFILE.message,
    LAYOUT_SESSION_PROGRESS.SETTING_UP_PROFILE.percentage,
  );
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  dependencies.start_background_sync();
  const completion = await dependencies.initial_sync_store.complete_sync();
  if (!completion.success)
    console.warn("[Layout] Demo session marker not saved; setup repeats", {
      event: LAYOUT_SESSION_EVENT.ANONYMOUS_MARKER_NOT_SAVED,
      error: completion.error,
    });
  console.log("[Layout] First-time anonymous user setup complete", {
    event: LAYOUT_SESSION_EVENT.ANONYMOUS_FIRST_TIME_SETUP_COMPLETE,
  });
  return create_success_result(true);
}

export async function handle_first_time_anonymous_user_session(
  dependencies: FirstTimeAnonymousSessionDependencies,
): Promise<Result<boolean>> {
  dependencies.initial_sync_store.start_sync();
  const decision = await decide_first_time_anonymous_reset(dependencies);
  if (decision.status !== FIRST_TIME_RESET_DECISION.RESET_ALLOWED)
    return keep_local_data_for_blocked_first_time_session(
      dependencies,
      decision,
    );
  return reset_and_initialize_first_time_session(dependencies);
}

export async function handle_returning_anonymous_user_session(
  dependencies: ReturningAnonymousSessionDependencies,
): Promise<Result<boolean>> {
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  dependencies.start_background_sync();
  console.log("[Layout] Returning anonymous user session restored", {
    event: LAYOUT_SESSION_EVENT.ANONYMOUS_RETURNING_SESSION_RESTORED,
  });
  return create_success_result(true);
}

interface VerifiedSessionResumeDependencies {
  auth_store: AuthStorePort;
  start_background_sync(): void;
  start_realtime_sync(): boolean;
  trigger_full_sync_on_page_reload(): void | Promise<void>;
}

export async function handle_verified_user_page_reload_session(
  dependencies: VerifiedSessionResumeDependencies,
): Promise<Result<boolean>> {
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  dependencies.start_background_sync();
  dependencies.start_realtime_sync();
  void dependencies.trigger_full_sync_on_page_reload();
  console.log("[Layout] Verified user page reload — session restored", {
    event: LAYOUT_SESSION_EVENT.VERIFIED_USER_PAGE_RELOAD_COMPLETE,
  });
  return create_success_result(true);
}
