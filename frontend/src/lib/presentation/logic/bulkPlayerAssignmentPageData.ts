import type { Player } from "$lib/core/entities/Player";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import { WILDCARD_SCOPE } from "$lib/core/entities/StatusConstants";
import type { Team } from "$lib/core/entities/Team";
import {
  build_authorization_list_filter,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";
import {
  build_player_assignments,
  type BulkPlayerAssignmentSelectedTeamState,
  create_membership_input,
  get_selected_player_assignments,
  get_today_date,
  type PlayerAssignment,
} from "$lib/presentation/logic/bulkPlayerAssignmentPageState";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

type EntityListResult<EntityType> = {
  success: boolean;
  data?: { items: EntityType[] };
};

export interface BulkPlayerAssignmentPageDependencies {
  gender_use_cases: {
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<{ id: string; name: string }>>;
  };
  membership_use_cases: {
    create: (
      input: ReturnType<typeof create_membership_input>,
    ) => Promise<{ success: boolean }>;
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<PlayerTeamMembership>>;
  };
  player_use_cases: {
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Player>>;
  };
  team_use_cases: {
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Team>>;
  };
}

export type BulkPlayerAssignmentProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

export function build_bulk_player_assignment_auth_filter(
  profile_state: BulkPlayerAssignmentProfileState,
): Record<string, string> {
  if (profile_state.status === PRESENCE_STATUS.MISSING) return {};

  return build_authorization_list_filter(profile_state.profile, [
    "organization_id",
    "team_id",
  ]);
}

type BulkPlayerAssignmentPageData = {
  all_player_assignments: PlayerAssignment[];
  error_message: string;
  gender_name_map: Map<string, string>;
  teams: Team[];
};

function build_failed_page_data(
  error_message: string,
): BulkPlayerAssignmentPageData {
  return {
    teams: [],
    all_player_assignments: [],
    gender_name_map: new Map(),
    error_message,
  };
}

async function load_bulk_player_assignment_gender_name_map(
  profile_state: BulkPlayerAssignmentProfileState,
  dependencies: BulkPlayerAssignmentPageDependencies,
): Promise<Map<string, string>> {
  const user_organization_id =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile.organization_id
      : "";
  const gender_filter: Record<string, string> =
    user_organization_id && user_organization_id !== WILDCARD_SCOPE
      ? { organization_id: user_organization_id }
      : {};
  const genders_result = await dependencies.gender_use_cases.list(
    gender_filter,
    { page_number: 1, page_size: 50 },
  );
  return new Map(
    (genders_result.success ? (genders_result.data?.items ?? []) : []).map(
      (gender) => [gender.id, gender.name],
    ),
  );
}

function fetch_bulk_player_assignment_lists(
  auth_filter: Record<string, string>,
  dependencies: BulkPlayerAssignmentPageDependencies,
): Promise<
  [
    EntityListResult<Team>,
    EntityListResult<Player>,
    EntityListResult<PlayerTeamMembership>,
  ]
> {
  return Promise.all([
    dependencies.team_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 200,
    }),
    dependencies.player_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 500,
    }),
    dependencies.membership_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 1000,
    }),
  ]);
}

export async function load_bulk_player_assignment_page_data(command: {
  profile_state: BulkPlayerAssignmentProfileState;
  dependencies: BulkPlayerAssignmentPageDependencies;
}): Promise<BulkPlayerAssignmentPageData> {
  const auth_filter = build_bulk_player_assignment_auth_filter(
    command.profile_state,
  );
  const [teams_result, players_result, memberships_result] =
    await fetch_bulk_player_assignment_lists(auth_filter, command.dependencies);
  if (!teams_result.success)
    return build_failed_page_data("Failed to load teams");
  if (!players_result.success)
    return build_failed_page_data("Failed to load players");
  const teams = teams_result.data?.items ?? [];
  const gender_name_map = await load_bulk_player_assignment_gender_name_map(
    command.profile_state,
    command.dependencies,
  );
  return {
    teams,
    all_player_assignments: build_player_assignments(
      players_result.data?.items ?? [],
      memberships_result.success ? (memberships_result.data?.items ?? []) : [],
      teams,
      get_today_date(),
    ),
    gender_name_map,
    error_message: "",
  };
}

export async function save_bulk_player_assignments(command: {
  assigned_players_on_other_teams: PlayerAssignment[];
  dependencies: BulkPlayerAssignmentPageDependencies;
  selected_team_state: BulkPlayerAssignmentSelectedTeamState;
  selected_team_id: string;
  unassigned_players: PlayerAssignment[];
}): Promise<{ error_count: number; success_count: number }> {
  let success_count = 0;
  let error_count = 0;
  for (const assignment of get_selected_player_assignments(
    command.unassigned_players,
    command.assigned_players_on_other_teams,
  )) {
    const result = await command.dependencies.membership_use_cases.create(
      create_membership_input(
        assignment,
        command.selected_team_state,
        command.selected_team_id,
      ),
    );
    if (result.success) {
      success_count += 1;
      continue;
    }
    error_count += 1;
  }
  return { success_count, error_count };
}
