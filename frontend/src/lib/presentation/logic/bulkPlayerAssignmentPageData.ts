import type { Player } from "$lib/core/entities/Player";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";
import {
  build_authorization_list_filter,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";
import {
  build_player_assignments,
  create_membership_input,
  get_selected_player_assignments,
  get_today_date,
  type PlayerAssignment,
} from "$lib/presentation/logic/bulkPlayerAssignmentPageState";

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

export function build_bulk_player_assignment_auth_filter(
  current_profile: UserScopeProfile | null,
): Record<string, string> {
  if (!current_profile) return {};
  return build_authorization_list_filter(current_profile, [
    "organization_id",
    "team_id",
  ]);
}

export async function load_bulk_player_assignment_page_data(command: {
  current_profile: UserScopeProfile | null;
  dependencies: BulkPlayerAssignmentPageDependencies;
}): Promise<{
  all_player_assignments: PlayerAssignment[];
  error_message: string;
  gender_name_map: Map<string, string>;
  teams: Team[];
}> {
  const auth_filter = build_bulk_player_assignment_auth_filter(
    command.current_profile,
  );
  const [teams_result, players_result, memberships_result] = await Promise.all([
    command.dependencies.team_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 200,
    }),
    command.dependencies.player_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 500,
    }),
    command.dependencies.membership_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 1000,
    }),
  ]);
  if (!teams_result.success) {
    return {
      teams: [],
      all_player_assignments: [],
      gender_name_map: new Map(),
      error_message: "Failed to load teams",
    };
  }
  if (!players_result.success) {
    return {
      teams: [],
      all_player_assignments: [],
      gender_name_map: new Map(),
      error_message: "Failed to load players",
    };
  }
  const teams = teams_result.data?.items ?? [];
  const user_organization_id = command.current_profile?.organization_id;
  const gender_filter: Record<string, string> =
    user_organization_id && user_organization_id !== "*"
      ? { organization_id: user_organization_id }
      : {};
  const genders_result = await command.dependencies.gender_use_cases.list(
    gender_filter,
    { page_number: 1, page_size: 50 },
  );
  return {
    teams,
    all_player_assignments: build_player_assignments(
      players_result.data?.items ?? [],
      memberships_result.success ? (memberships_result.data?.items ?? []) : [],
      teams,
      get_today_date(),
    ),
    gender_name_map: new Map(
      (genders_result.success ? (genders_result.data?.items ?? []) : []).map(
        (gender) => [gender.id, gender.name],
      ),
    ),
    error_message: "",
  };
}

export async function save_bulk_player_assignments(command: {
  assigned_players_on_other_teams: PlayerAssignment[];
  dependencies: BulkPlayerAssignmentPageDependencies;
  selected_team: Team | null;
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
        command.selected_team,
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
