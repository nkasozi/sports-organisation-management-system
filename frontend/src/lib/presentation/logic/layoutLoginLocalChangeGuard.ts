import type { AsyncResult, Result } from "$lib/core/types/Result";
import { create_failure_result } from "$lib/core/types/Result";

import {
  LAYOUT_SESSION_EVENT,
  LAYOUT_SESSION_MESSAGE,
} from "./layoutSessionConstants";
import {
  build_sign_in_error_path,
  SIGN_IN_ERROR_CODE,
  type SignInErrorCode,
} from "./signInPageState";

const LoginLocalChangeGuardStatus = {
  NO_UNSYNCED_CHANGES: "no_unsynced_changes",
  DISCARD_CONFIRMED: "discard_confirmed",
  DISCARD_DECLINED: "discard_declined",
  COUNT_UNAVAILABLE: "count_unavailable",
} as const;

type LoginLocalChangeGuard =
  | { status: typeof LoginLocalChangeGuardStatus.NO_UNSYNCED_CHANGES }
  | {
      status: typeof LoginLocalChangeGuardStatus.DISCARD_CONFIRMED;
      unsynced_count: number;
    }
  | {
      status: typeof LoginLocalChangeGuardStatus.DISCARD_DECLINED;
      unsynced_count: number;
    }
  | {
      status: typeof LoginLocalChangeGuardStatus.COUNT_UNAVAILABLE;
      error: string;
    };

export interface LoginLocalChangeGuardDependencies {
  get_unsynced_local_change_count(): AsyncResult<number>;
  confirm_discard_unsynced_local_changes(
    unsynced_count: number,
  ): Promise<boolean>;
}

interface LoginAbortDependencies {
  initial_sync_store: { reset(): void };
  sign_out(): Promise<unknown>;
  goto(path: string): Promise<void>;
}

export async function evaluate_login_local_change_guard(
  dependencies: LoginLocalChangeGuardDependencies,
): Promise<LoginLocalChangeGuard> {
  const count_result = await dependencies.get_unsynced_local_change_count();
  if (!count_result.success)
    return {
      status: LoginLocalChangeGuardStatus.COUNT_UNAVAILABLE,
      error: count_result.error,
    };
  if (count_result.data === 0)
    return { status: LoginLocalChangeGuardStatus.NO_UNSYNCED_CHANGES };
  const discard_confirmed =
    await dependencies.confirm_discard_unsynced_local_changes(
      count_result.data,
    );
  return {
    status: discard_confirmed
      ? LoginLocalChangeGuardStatus.DISCARD_CONFIRMED
      : LoginLocalChangeGuardStatus.DISCARD_DECLINED,
    unsynced_count: count_result.data,
  };
}

export function allows_login_data_wipe(guard: LoginLocalChangeGuard): boolean {
  switch (guard.status) {
    case LoginLocalChangeGuardStatus.NO_UNSYNCED_CHANGES:
    case LoginLocalChangeGuardStatus.DISCARD_CONFIRMED:
      return true;
    case LoginLocalChangeGuardStatus.DISCARD_DECLINED:
    case LoginLocalChangeGuardStatus.COUNT_UNAVAILABLE:
      return false;
  }
}

function resolve_login_blocked_error_code(
  guard: LoginLocalChangeGuard,
): SignInErrorCode {
  switch (guard.status) {
    case LoginLocalChangeGuardStatus.COUNT_UNAVAILABLE:
      return SIGN_IN_ERROR_CODE.LOCAL_CHANGES_CHECK_FAILED;
    case LoginLocalChangeGuardStatus.NO_UNSYNCED_CHANGES:
    case LoginLocalChangeGuardStatus.DISCARD_CONFIRMED:
    case LoginLocalChangeGuardStatus.DISCARD_DECLINED:
      return SIGN_IN_ERROR_CODE.UNSYNCED_LOCAL_CHANGES;
  }
}

export async function abort_login_to_protect_local_changes(
  dependencies: LoginAbortDependencies,
  guard: LoginLocalChangeGuard,
): Promise<Result<boolean>> {
  console.warn("[Layout] Login sync stopped to protect unsynced changes", {
    event: LAYOUT_SESSION_EVENT.LOGIN_SYNC_BLOCKED_UNSYNCED_CHANGES,
    guard_status: guard.status,
  });
  dependencies.initial_sync_store.reset();
  await dependencies.sign_out();
  await dependencies.goto(
    build_sign_in_error_path(resolve_login_blocked_error_code(guard)),
  );
  return create_failure_result(LAYOUT_SESSION_MESSAGE.LOGIN_BLOCKED);
}
