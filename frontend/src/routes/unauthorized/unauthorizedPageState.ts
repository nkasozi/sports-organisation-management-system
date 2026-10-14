import type { AsyncResult } from "$lib/core/types/Result";

export const UNAUTHORIZED_SIGN_OUT_STATUS = {
  IDLE: "idle",
  SIGNING_OUT: "signing_out",
  FAILED: "failed",
} as const;

export const UNAUTHORIZED_PAGE_MESSAGES = {
  SIGN_OUT_FAILED:
    "We couldn't sign you out. Please check your connection and try again.",
} as const;

export const UNAUTHORIZED_PAGE_PATHS = {
  HOME: "/",
  CONTACT: "/contact",
} as const;

const UNAUTHORIZED_SIGN_OUT_FAILED_EVENT = "unauthorized_page_sign_out_failed";

export type UnauthorizedSignOutState =
  | { status: typeof UNAUTHORIZED_SIGN_OUT_STATUS.IDLE }
  | { status: typeof UNAUTHORIZED_SIGN_OUT_STATUS.SIGNING_OUT }
  | { status: typeof UNAUTHORIZED_SIGN_OUT_STATUS.FAILED; message: string };

export const INITIAL_UNAUTHORIZED_SIGN_OUT_STATE: UnauthorizedSignOutState = {
  status: UNAUTHORIZED_SIGN_OUT_STATUS.IDLE,
};

interface UnauthorizedSignOutCommand {
  sign_out_and_tear_down_device(landing_path: string): AsyncResult<boolean>;
  on_state_change(state: UnauthorizedSignOutState): unknown;
}

export async function run_unauthorized_sign_out(
  command: UnauthorizedSignOutCommand,
): Promise<UnauthorizedSignOutState> {
  const signing_out_state: UnauthorizedSignOutState = {
    status: UNAUTHORIZED_SIGN_OUT_STATUS.SIGNING_OUT,
  };
  command.on_state_change(signing_out_state);
  const teardown_result = await command.sign_out_and_tear_down_device(
    UNAUTHORIZED_PAGE_PATHS.HOME,
  );
  if (teardown_result.success) return signing_out_state;
  console.error("[UnauthorizedPage] Sign out failed", {
    event: UNAUTHORIZED_SIGN_OUT_FAILED_EVENT,
    error: teardown_result.error,
  });
  return {
    status: UNAUTHORIZED_SIGN_OUT_STATUS.FAILED,
    message: UNAUTHORIZED_PAGE_MESSAGES.SIGN_OUT_FAILED,
  };
}
