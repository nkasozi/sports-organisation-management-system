import type { AsyncResult, Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  SESSION_SYNC_NOTICE_KIND,
  type SessionSyncNoticeKind,
} from "$lib/presentation/stores/sessionSyncNotice";

import { PRESENCE_STATUS } from "./presenceStatus";

export const HEADER_LOGOUT_START = {
  SHOW_WARNING: "show_warning",
  GO_TO_SIGN_IN: "go_to_sign_in",
} as const;

const HOME_PATH = "/";
const PROFILE_SWITCH_COMPLETED_EVENT = "profile_switch_completed";
const HEADER_LOGOUT_FAILED_EVENT = "header_logout_failed";

type HeaderLogoutStart =
  (typeof HEADER_LOGOUT_START)[keyof typeof HEADER_LOGOUT_START];

interface HeaderLogoutCommand {
  sign_out_and_tear_down_device(landing_path: string): AsyncResult<boolean>;
  show_session_notice(kind: SessionSyncNoticeKind): boolean;
}

interface HeaderProfileSwitchCommand {
  switch_profile(profile_id: string): Promise<boolean>;
  invalidate_route_access_cache(): unknown;
  invalidate_all(): Promise<unknown>;
  goto(path: string, options: { replaceState: boolean }): Promise<unknown>;
}

interface SwitchableHeaderProfile {
  id: string;
  role: string;
}

type HeaderProfileTeamState =
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: { team_name?: string } }
  | { status: typeof PRESENCE_STATUS.MISSING };

export function resolve_header_logout_start(
  is_signed_in: boolean,
): HeaderLogoutStart {
  return is_signed_in
    ? HEADER_LOGOUT_START.SHOW_WARNING
    : HEADER_LOGOUT_START.GO_TO_SIGN_IN;
}

export async function run_header_logout(
  command: HeaderLogoutCommand,
): Promise<Result<boolean>> {
  const teardown_result =
    await command.sign_out_and_tear_down_device(HOME_PATH);
  if (teardown_result.success) return create_success_result(true);
  console.error("[Header] Logout could not finish", {
    event: HEADER_LOGOUT_FAILED_EVENT,
    error: teardown_result.error,
  });
  command.show_session_notice(SESSION_SYNC_NOTICE_KIND.SIGN_OUT_CLEANUP_FAILED);
  return create_failure_result(teardown_result.error);
}

export async function switch_header_profile(
  command: HeaderProfileSwitchCommand,
  profile: SwitchableHeaderProfile,
): Promise<boolean> {
  const switched = await command.switch_profile(profile.id);
  if (!switched) return false;
  console.log("[Header] Switched profile", {
    event: PROFILE_SWITCH_COMPLETED_EVENT,
    profile_id: profile.id,
    role: profile.role,
  });
  command.invalidate_route_access_cache();
  await command.invalidate_all();
  await command.goto(HOME_PATH, { replaceState: true });
  return true;
}

export function resolve_header_profile_team_name(
  profile_state: HeaderProfileTeamState,
): string {
  if (profile_state.status !== PRESENCE_STATUS.PRESENT) return "";
  return profile_state.profile.team_name || "";
}
