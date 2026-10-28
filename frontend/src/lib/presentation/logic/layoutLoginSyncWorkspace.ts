import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { ConvexUserProfile } from "$lib/presentation/stores/authTypes";
import { SESSION_SYNC_RETRY_KIND } from "$lib/presentation/stores/sessionSyncRetryNotice";

import { should_pull_org_from_server } from "./layoutLogic";
import { stop_login_sync_for_retry } from "./layoutLoginSyncFailure";
import {
  type LayoutLoginSyncDependencies,
  LOGIN_PROFILE_LOOKUP_STATUS,
} from "./layoutLoginSyncPorts";
import { create_inactive_sync_progress_subscription } from "./layoutLoginSyncProgress";
import { sign_out_after_failed_login } from "./layoutLoginSyncSignOut";
import { protect_and_clear_login_workspace } from "./layoutLoginSyncVaultProtection";
import {
  LAYOUT_SESSION_EVENT,
  LAYOUT_SESSION_MESSAGE,
  LAYOUT_SESSION_PROGRESS,
} from "./layoutSessionConstants";
import {
  run_with_timeout,
  SESSION_OPERATION_TIMEOUT_MS,
} from "./layoutSessionTimeouts";
import {
  build_unauthorized_reason_path,
  UNAUTHORIZED_REASON_CODE,
} from "./unauthorizedReason";

const ORGANIZATIONS_TABLE = "organizations";
const TEAMS_TABLE = "teams";
const IDENTIFIER_STATUS = { ABSENT: "absent", PRESENT: "present" } as const;

type ProfileIdentifierState =
  | { status: typeof IDENTIFIER_STATUS.ABSENT }
  | { status: typeof IDENTIFIER_STATUS.PRESENT; value: string };

interface LoginSyncProfile {
  profile: ConvexUserProfile;
  organization_id: ProfileIdentifierState;
  team_id: ProfileIdentifierState;
}

function create_profile_identifier_state(
  value: string | undefined,
): ProfileIdentifierState {
  return value
    ? { status: IDENTIFIER_STATUS.PRESENT, value }
    : { status: IDENTIFIER_STATUS.ABSENT };
}

function normalize_login_sync_profile(
  profile: ConvexUserProfile,
): LoginSyncProfile {
  return {
    profile,
    organization_id: create_profile_identifier_state(profile.organization_id),
    team_id: create_profile_identifier_state(profile.team_id),
  };
}

async function sign_out_unregistered_user(
  dependencies: LayoutLoginSyncDependencies,
  error: string,
): Promise<Result<LoginSyncProfile>> {
  console.warn("[Layout] No server profile found for signed-in user", {
    event: LAYOUT_SESSION_EVENT.LOGIN_PROFILE_NOT_FOUND,
    error,
  });
  dependencies.initial_sync_store.reset();
  await sign_out_after_failed_login(
    dependencies,
    build_unauthorized_reason_path(UNAUTHORIZED_REASON_CODE.NOT_REGISTERED),
  );
  return create_failure_result(LAYOUT_SESSION_MESSAGE.NO_PROFILE_FOUND);
}

export async function look_up_login_sync_profile(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<LoginSyncProfile>> {
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.LOOKING_UP_PROFILE.message,
    LAYOUT_SESSION_PROGRESS.LOOKING_UP_PROFILE.percentage,
  );
  const lookup = await dependencies.look_up_current_user_profile();
  switch (lookup.status) {
    case LOGIN_PROFILE_LOOKUP_STATUS.FOUND:
      return create_success_result(
        normalize_login_sync_profile(lookup.profile),
      );
    case LOGIN_PROFILE_LOOKUP_STATUS.NOT_FOUND:
      return sign_out_unregistered_user(dependencies, lookup.error);
    case LOGIN_PROFILE_LOOKUP_STATUS.UNAVAILABLE:
      return stop_login_sync_for_retry(
        dependencies,
        SESSION_SYNC_RETRY_KIND.PROFILE_UNAVAILABLE,
        LAYOUT_SESSION_MESSAGE.PROFILE_UNAVAILABLE,
        create_inactive_sync_progress_subscription(),
      );
  }
}

async function pull_profile_scope_records(
  dependencies: LayoutLoginSyncDependencies,
  login_sync_profile: LoginSyncProfile,
): Promise<boolean> {
  const { organization_id, team_id } = login_sync_profile;
  if (
    organization_id.status === IDENTIFIER_STATUS.PRESENT &&
    should_pull_org_from_server(organization_id.value)
  ) {
    dependencies.initial_sync_store.update_progress(
      LAYOUT_SESSION_PROGRESS.LOADING_ORGANIZATION.message,
      LAYOUT_SESSION_PROGRESS.LOADING_ORGANIZATION.percentage,
    );
    await run_with_timeout(
      dependencies.pull_user_scoped_record_from_convex(
        ORGANIZATIONS_TABLE,
        organization_id.value,
      ),
      SESSION_OPERATION_TIMEOUT_MS.SCOPED_RECORD_PULL,
    );
  }
  if (team_id.status !== IDENTIFIER_STATUS.PRESENT) return true;
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.LOADING_TEAM.message,
    LAYOUT_SESSION_PROGRESS.LOADING_TEAM.percentage,
  );
  await run_with_timeout(
    dependencies.pull_user_scoped_record_from_convex(
      TEAMS_TABLE,
      team_id.value,
    ),
    SESSION_OPERATION_TIMEOUT_MS.SCOPED_RECORD_PULL,
  );
  return true;
}

export async function prepare_login_sync_workspace(
  dependencies: LayoutLoginSyncDependencies,
  login_sync_profile: LoginSyncProfile,
): Promise<Result<boolean>> {
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.PREPARING_WORKSPACE.message,
    LAYOUT_SESSION_PROGRESS.PREPARING_WORKSPACE.percentage,
  );
  const cleared = await protect_and_clear_login_workspace(
    dependencies,
    login_sync_profile.profile,
  );
  if (!cleared.success) return cleared;
  await dependencies.reset_sync_metadata();
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.SETTING_UP_ACCOUNT.message,
    LAYOUT_SESSION_PROGRESS.SETTING_UP_ACCOUNT.percentage,
  );
  await dependencies.write_convex_user_to_local_dexie(
    login_sync_profile.profile,
  );
  await pull_profile_scope_records(dependencies, login_sync_profile);
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.STARTING_DATA_SYNC.message,
    LAYOUT_SESSION_PROGRESS.STARTING_DATA_SYNC.percentage,
  );
  dependencies.set_pulling_from_remote(false);
  return create_success_result(true);
}
