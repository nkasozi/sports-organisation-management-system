import { get_sport_by_id } from "$lib/adapters/persistence/sportService";
import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import {
  ANY_VALUE,
  build_authorization_list_filter,
  get_authorization_preselect_values,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";
import {
  build_error_message,
  derive_initial_selected_players,
} from "$lib/core/services/fixtureLineupWizard";
import {
  build_position_name_by_id,
  build_team_players,
  type TeamPlayer,
} from "$lib/core/services/teamPlayers";
import {
  get_competition_team_use_cases,
  get_competition_use_cases,
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_organization_use_cases,
  get_player_position_use_cases,
  get_player_team_membership_use_cases,
  get_player_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";
import { build_fixture_team_label_map } from "$lib/presentation/logic/fixtureLineupCreateState";

type FixtureLineupUseCases = ReturnType<typeof get_fixture_lineup_use_cases>;
type FixtureUseCases = ReturnType<typeof get_fixture_use_cases>;
type TeamUseCases = ReturnType<typeof get_team_use_cases>;
type PlayerUseCases = ReturnType<typeof get_player_use_cases>;
type CompetitionUseCases = ReturnType<typeof get_competition_use_cases>;
type CompetitionTeamUseCases = ReturnType<
  typeof get_competition_team_use_cases
>;
type MembershipUseCases = ReturnType<
  typeof get_player_team_membership_use_cases
>;
type PlayerPositionUseCases = ReturnType<typeof get_player_position_use_cases>;
type OrganizationUseCases = ReturnType<typeof get_organization_use_cases>;

export interface FixtureLineupCreateDependencies {
  lineup_use_cases: FixtureLineupUseCases;
  fixture_use_cases: FixtureUseCases;
  team_use_cases: TeamUseCases;
  player_use_cases: PlayerUseCases;
  competition_use_cases: CompetitionUseCases;
  competition_team_use_cases: CompetitionTeamUseCases;
  membership_use_cases: MembershipUseCases;
  player_position_use_cases: PlayerPositionUseCases;
  organization_use_cases: OrganizationUseCases;
}

export interface FixtureLineupCreateReferenceData {
  fixtures: Fixture[];
  teams: Team[];
  all_teams: Team[];
  all_competitions: Competition[];
  organizations: Organization[];
  selected_organization: Organization | null;
  error_message: string;
}

export interface FixtureLineupCreateFixtureData {
  selected_fixture: Fixture;
  organization_id: string;
  min_players: number;
  max_players: number;
  starters_count: number;
  teams: Team[];
  available_teams: Team[];
  competition_teams_for_fixture: CompetitionTeam[];
  fixture_team_label_by_team_id: Map<string, string>;
  teams_with_existing_lineups: Map<string, string>;
  auto_selected_team_id: string;
}

export interface FixtureLineupCreateTeamData {
  selected_team: Team | null;
  team_players: TeamPlayer[];
  selected_players: CreateFixtureLineupInput["selected_players"];
  validation_error: string;
}

export async function load_fixture_lineup_create_reference_data(
  current_auth_profile: UserScopeProfile | null,
  form_organization_id: string,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureLineupCreateReferenceData> {
  const auth_filter = build_authorization_list_filter(current_auth_profile, [
    "organization_id",
  ]);
  const preselect_values =
    get_authorization_preselect_values(current_auth_profile);
  const [
    fixtures_result,
    teams_result,
    competitions_result,
    organizations_result,
  ] = await Promise.all([
    dependencies.fixture_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 200,
    }),
    dependencies.team_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 200,
    }),
    dependencies.competition_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 200,
    }),
    dependencies.organization_use_cases.list(
      {},
      { page_number: 1, page_size: 200 },
    ),
  ]);
  const fixtures = fixtures_result.success
    ? fixtures_result.data?.items || []
    : [];
  const teams = teams_result.success ? teams_result.data?.items || [] : [];
  const all_competitions = competitions_result.success
    ? competitions_result.data?.items || []
    : [];
  const all_fetched_organizations = organizations_result.success
    ? organizations_result.data?.items || []
    : [];
  const user_organization_id = current_auth_profile?.organization_id;
  const organizations =
    user_organization_id === ANY_VALUE
      ? all_fetched_organizations
      : user_organization_id
        ? all_fetched_organizations.filter(
            (organization) => organization.id === user_organization_id,
          )
        : [];
  const selected_organization =
    organizations.find(
      (organization) =>
        organization.id ===
        (preselect_values.organization_id || form_organization_id),
    ) || null;
  return {
    fixtures,
    teams,
    all_teams: teams,
    all_competitions,
    organizations,
    selected_organization,
    error_message:
      fixtures.length === 0
        ? build_error_message(
            "No fixtures available.",
            "A fixture is required to submit a team lineup.",
            "Create fixtures first (Fixtures tab), then come back here to submit a lineup.",
          )
        : "",
  };
}

export async function load_fixture_lineup_create_fixture_data(
  fixture_id: string,
  current_auth_profile: UserScopeProfile | null,
  dependencies: FixtureLineupCreateDependencies,
): Promise<
  | { success: true; data: FixtureLineupCreateFixtureData }
  | { success: false; error_message: string; should_clear_fixture: boolean }
> {
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data)
    return {
      success: false,
      error_message: build_error_message(
        "Failed to load fixture.",
        "The selected fixture could not be found.",
        "Refresh the page and try selecting the fixture again.",
      ),
      should_clear_fixture: true,
    };
  const selected_fixture = fixture_result.data;
  if (selected_fixture.status !== "scheduled")
    return {
      success: false,
      error_message: build_error_message(
        "This fixture cannot accept lineup submissions.",
        `The fixture status is "${selected_fixture.status.replace(/_/g, " ")}". Only fixtures with "scheduled" status can receive new lineups.`,
        "Select a different fixture that is still scheduled.",
      ),
      should_clear_fixture: true,
    };
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    selected_fixture.competition_id,
  );
  if (!competition_result.success || !competition_result.data)
    return {
      success: false,
      error_message: build_error_message(
        "Failed to load competition for fixture.",
        "Competition data is required to determine lineup rules.",
        "Ensure the fixture has a valid competition, then retry.",
      ),
      should_clear_fixture: false,
    };
  const competition = competition_result.data;
  const [
    organization_result,
    competition_teams_result,
    home_team_result,
    away_team_result,
    existing_lineups_result,
  ] = await Promise.all([
    dependencies.organization_use_cases.get_by_id(competition.organization_id),
    dependencies.competition_team_use_cases.list_teams_in_competition(
      competition.id,
      { page_number: 1, page_size: 2000 },
    ),
    dependencies.team_use_cases.get_by_id(selected_fixture.home_team_id),
    dependencies.team_use_cases.get_by_id(selected_fixture.away_team_id),
    dependencies.lineup_use_cases.list_lineups_by_fixture(fixture_id, {
      page: 1,
      page_size: 100,
    }),
  ]);
  let min_players = 2,
    max_players = 18,
    starters_count = 11;
  if (organization_result.success && organization_result.data?.sport_id) {
    const sport_result = await get_sport_by_id(
      organization_result.data.sport_id,
    );
    if (sport_result.success && sport_result.data) {
      min_players = sport_result.data.min_players_per_fixture || 2;
      max_players = sport_result.data.max_players_per_fixture || 18;
      starters_count = sport_result.data.max_players_on_field || 11;
    }
  }
  if (competition.rule_overrides) {
    if (competition.rule_overrides.min_players_on_field !== undefined)
      min_players = competition.rule_overrides.min_players_on_field;
    if (competition.rule_overrides.max_squad_size !== undefined)
      max_players = competition.rule_overrides.max_squad_size;
    if (competition.rule_overrides.max_players_on_field !== undefined)
      starters_count = competition.rule_overrides.max_players_on_field;
  }
  const teams: Team[] = [];
  if (home_team_result.success && home_team_result.data)
    teams.push(home_team_result.data);
  if (away_team_result.success && away_team_result.data)
    teams.push(away_team_result.data);
  const competition_teams_for_fixture =
    competition_teams_result.success && competition_teams_result.data
      ? competition_teams_result.data.items
      : [];
  const fixture_team_label_by_team_id = build_fixture_team_label_map(
    teams,
    competition_teams_for_fixture,
  );
  const teams_with_existing_lineups = new Map<string, string>();
  if (existing_lineups_result.success && existing_lineups_result.data) {
    for (const lineup of existing_lineups_result.data.items) {
      const team = teams.find(
        (current_team) => current_team.id === lineup.team_id,
      );
      teams_with_existing_lineups.set(
        lineup.team_id,
        team
          ? fixture_team_label_by_team_id.get(team.id) || team.name
          : lineup.team_id,
      );
    }
  }
  const available_teams = teams.filter(
    (team) => !teams_with_existing_lineups.has(team.id),
  );
  if (available_teams.length === 0 && teams.length > 0)
    return {
      success: false,
      error_message: build_error_message(
        "All teams have already submitted lineups for this fixture.",
        `"${competition.name}" already has lineups from all participating teams.`,
        "Select a different fixture that still needs team lineups.",
      ),
      should_clear_fixture: true,
    };
  const preselect_values =
    get_authorization_preselect_values(current_auth_profile);
  if (
    preselect_values.team_id &&
    teams_with_existing_lineups.has(preselect_values.team_id)
  )
    return {
      success: false,
      error_message: build_error_message(
        "Your team has already submitted a lineup for this fixture.",
        "Each team can only submit one lineup per fixture.",
        "Select a different fixture or view your existing lineup.",
      ),
      should_clear_fixture: true,
    };
  return {
    success: true,
    data: {
      selected_fixture,
      organization_id: competition.organization_id,
      min_players,
      max_players,
      starters_count,
      teams,
      available_teams,
      competition_teams_for_fixture,
      fixture_team_label_by_team_id,
      teams_with_existing_lineups,
      auto_selected_team_id:
        preselect_values.team_id &&
        available_teams.some((team) => team.id === preselect_values.team_id)
          ? preselect_values.team_id
          : "",
    },
  };
}

export async function load_fixture_lineup_create_team_data(
  team_id: string,
  selected_fixture: Fixture | null,
  current_auth_profile: UserScopeProfile | null,
  max_players: number,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureLineupCreateTeamData> {
  if (!selected_fixture)
    return {
      selected_team: null,
      team_players: [],
      selected_players: [],
      validation_error: build_error_message(
        "No fixture selected.",
        "A fixture is required before you can choose a team.",
        "Select a fixture in Step 1, then continue.",
      ),
    };
  const fixture_team_ids = new Set([
    selected_fixture.home_team_id,
    selected_fixture.away_team_id,
  ]);
  if (!fixture_team_ids.has(team_id))
    return {
      selected_team: null,
      team_players: [],
      selected_players: [],
      validation_error: build_error_message(
        "Invalid team selection.",
        "Only teams participating in the selected fixture can submit a lineup.",
        "Choose either the home or away team listed for the fixture.",
      ),
    };
  const [team_result, players_result, memberships_result, positions_result] =
    await Promise.all([
      dependencies.team_use_cases.get_by_id(team_id),
      dependencies.player_use_cases.list_players_by_team(team_id, {
        page_number: 1,
        page_size: 500,
      }),
      dependencies.membership_use_cases.list_memberships_by_team(team_id, {
        page_number: 1,
        page_size: 5000,
      }),
      dependencies.player_position_use_cases.list(
        current_auth_profile?.organization_id &&
          current_auth_profile.organization_id !== ANY_VALUE
          ? { organization_id: current_auth_profile.organization_id }
          : undefined,
        { page_number: 1, page_size: 500 },
      ),
    ]);
  const selected_team = team_result.success ? (team_result.data ?? null) : null;
  const position_name_by_id = build_position_name_by_id(
    positions_result.success ? positions_result.data.items : [],
  );
  const team_players = build_team_players(
    players_result.success && players_result.data
      ? players_result.data.items
      : [],
    memberships_result.success && memberships_result.data
      ? memberships_result.data.items
      : [],
    position_name_by_id,
  );
  if (team_players.length === 0)
    return {
      selected_team,
      team_players: [],
      selected_players: [],
      validation_error: build_error_message(
        "No players found for this team.",
        "A team must have players assigned via Player-Team Memberships.",
        "Create Player-Team Memberships for this team, then retry.",
      ),
    };
  return {
    selected_team,
    team_players,
    selected_players: derive_initial_selected_players(
      team_players,
      max_players,
    ),
    validation_error: "",
  };
}

export async function submit_fixture_lineup_create_form(
  form_data: CreateFixtureLineupInput,
  selected_organization: Organization | null,
  selected_fixture: Fixture | null,
  selected_team: Team | null,
  min_players: number,
  max_players: number,
  confirm_lock_understood: boolean,
  dependencies: FixtureLineupCreateDependencies,
): Promise<
  | { success: true; lineup_id: string }
  | { success: false; error_message: string; step_index: number }
> {
  if (!selected_organization || !form_data.organization_id)
    return {
      success: false,
      error_message: build_error_message(
        "Organization is required.",
        "A lineup must belong to an organization.",
        "Select an organization in Step 1.",
      ),
      step_index: 0,
    };
  if (!selected_fixture || !form_data.fixture_id)
    return {
      success: false,
      error_message: build_error_message(
        "Fixture is required.",
        "A lineup must belong to a fixture.",
        "Select a fixture in Step 2.",
      ),
      step_index: 1,
    };
  if (!selected_team || !form_data.team_id)
    return {
      success: false,
      error_message: build_error_message(
        "Team is required.",
        "A lineup must be submitted by a team participating in the fixture.",
        "Select a team in Step 3.",
      ),
      step_index: 2,
    };
  const count = form_data.selected_players.length;
  if (count < min_players || count > max_players)
    return {
      success: false,
      error_message: build_error_message(
        "Invalid squad size.",
        `This fixture requires between ${min_players} and ${max_players} players, but ${count} were selected.`,
        "Adjust the selected players in Step 4, then confirm again.",
      ),
      step_index: 3,
    };
  if (!confirm_lock_understood)
    return {
      success: false,
      error_message: build_error_message(
        "Confirmation required.",
        "Submitting a lineup locks it to prevent accidental changes.",
        "Tick the confirmation checkbox in Step 5 to proceed.",
      ),
      step_index: 4,
    };
  const existing_lineup_result =
    await dependencies.lineup_use_cases.get_lineup_for_team_in_fixture(
      form_data.fixture_id,
      form_data.team_id,
    );
  if (existing_lineup_result.success)
    return {
      success: false,
      error_message: build_error_message(
        "A lineup already exists for this team in this fixture.",
        "Only one locked lineup is allowed per team per fixture.",
        "Open the existing lineup from the Fixture Lineups list.",
      ),
      step_index: 4,
    };
  const create_result = await dependencies.lineup_use_cases.create({
    ...form_data,
    status: "locked",
    submitted_at: new Date().toISOString(),
    submitted_by: form_data.submitted_by?.trim() || "system",
  });
  if (!create_result.success || !create_result.data)
    return {
      success: false,
      error_message:
        (!create_result.success ? create_result.error : null) ||
        build_error_message(
          "Failed to submit lineup.",
          "The lineup could not be saved.",
          "Retry. If the problem persists, reset demo data and try again.",
        ),
      step_index: 4,
    };
  return { success: true, lineup_id: create_result.data.id };
}
