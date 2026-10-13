import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { ConvexUserProfile } from "$lib/presentation/stores/authTypes";

import { should_pull_org_from_server } from "./layoutLogic";
import type { LayoutLoginSyncDependencies } from "./layoutLoginSyncPorts";
import { sign_out_after_failed_login } from "./layoutLoginSyncSignOut";
import { APP_ROUTE_PATH } from "./layoutRouteConstants";
import {
  LAYOUT_SESSION_EVENT,
  LAYOUT_SESSION_MESSAGE,
  LAYOUT_SESSION_PROGRESS,
} from "./layoutSessionConstants";

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

export async function look_up_login_sync_profile(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<LoginSyncProfile>> {
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.LOOKING_UP_PROFILE.message,
    LAYOUT_SESSION_PROGRESS.LOOKING_UP_PROFILE.percentage,
  );
  const profile_result =
    await dependencies.fetch_current_user_profile_from_convex();
  if (profile_result.success)
    return create_success_result(
      normalize_login_sync_profile(profile_result.data),
    );
  console.warn("[Layout] No Convex profile found for signed-in user", {
    event: LAYOUT_SESSION_EVENT.LOGIN_PROFILE_NOT_FOUND,
    error: profile_result.error,
  });
  dependencies.initial_sync_store.reset();
  await sign_out_after_failed_login(dependencies, APP_ROUTE_PATH.UNAUTHORIZED);
  return create_failure_result(LAYOUT_SESSION_MESSAGE.NO_PROFILE_FOUND);
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
    await dependencies.pull_user_scoped_record_from_convex(
      ORGANIZATIONS_TABLE,
      organization_id.value,
    );
  }
  if (team_id.status !== IDENTIFIER_STATUS.PRESENT) return true;
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.LOADING_TEAM.message,
    LAYOUT_SESSION_PROGRESS.LOADING_TEAM.percentage,
  );
  await dependencies.pull_user_scoped_record_from_convex(
    TEAMS_TABLE,
    team_id.value,
  );
  return true;
}

export async function prepare_login_sync_workspace(
  dependencies: LayoutLoginSyncDependencies,
  login_sync_profile: LoginSyncProfile,
): Promise<boolean> {
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.PREPARING_WORKSPACE.message,
    LAYOUT_SESSION_PROGRESS.PREPARING_WORKSPACE.percentage,
  );
  dependencies.set_pulling_from_remote(true);
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.CLEARING_LOCAL_DATA.message,
    LAYOUT_SESSION_PROGRESS.CLEARING_LOCAL_DATA.percentage,
  );
  await dependencies.reset_database();
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
  return true;
}
