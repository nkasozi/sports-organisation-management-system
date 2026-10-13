import { get_sport_by_id } from "$lib/adapters/persistence/sportService";
import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { build_error_message } from "$lib/core/services/fixtureLineupWizard";

import {
  apply_competition_player_limit_overrides,
  build_sport_player_limits,
  DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS,
  type FixtureLineupPlayerLimits,
} from "./fixtureLineupCreateDataFixtureRules";
import type { FixtureLineupCreateDependencies } from "./fixtureLineupCreateDataTypes";

export const FIXTURE_DATA_FAILURE_REASON = {
  FIXTURE_UNAVAILABLE: "fixture_unavailable",
  COMPETITION_UNAVAILABLE: "competition_unavailable",
  ALL_TEAMS_SUBMITTED: "all_teams_submitted",
  TEAM_ALREADY_SUBMITTED: "team_already_submitted",
} as const;

export type FixtureDataFailureReason =
  (typeof FIXTURE_DATA_FAILURE_REASON)[keyof typeof FIXTURE_DATA_FAILURE_REASON];

export type FixtureDataFailure = {
  success: false;
  error_message: string;
  should_clear_fixture: boolean;
  failure_reason: FixtureDataFailureReason;
};

export type FixtureDataStep<T> =
  | { success: true; data: T }
  | FixtureDataFailure;

type LineupDependencies = FixtureLineupCreateDependencies;

export interface FixtureRelatedRecords {
  organization: Awaited<
    ReturnType<LineupDependencies["organization_use_cases"]["get_by_id"]>
  >;
  competition_teams: Awaited<
    ReturnType<
      LineupDependencies["competition_team_use_cases"]["list_teams_in_competition"]
    >
  >;
  home_team: Awaited<
    ReturnType<LineupDependencies["team_use_cases"]["get_by_id"]>
  >;
  away_team: Awaited<
    ReturnType<LineupDependencies["team_use_cases"]["get_by_id"]>
  >;
  lineups: Awaited<
    ReturnType<
      LineupDependencies["lineup_use_cases"]["list_lineups_by_fixture"]
    >
  >;
}

export function create_fixture_data_failure(
  error: string,
  why: string,
  how_to_fix: string,
  should_clear_fixture: boolean,
  failure_reason: FixtureDataFailureReason,
): FixtureDataFailure {
  return {
    success: false,
    error_message: build_error_message(error, why, how_to_fix),
    should_clear_fixture,
    failure_reason,
  };
}

export async function load_scheduled_fixture(
  fixture_id: string,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureDataStep<Fixture>> {
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data)
    return create_fixture_data_failure(
      "Failed to load fixture.",
      "The selected fixture could not be found.",
      "Refresh the page and try selecting the fixture again.",
      true,
      FIXTURE_DATA_FAILURE_REASON.FIXTURE_UNAVAILABLE,
    );
  const selected_fixture = fixture_result.data;
  if (selected_fixture.status !== FIXTURE_STATUS.SCHEDULED)
    return create_fixture_data_failure(
      "This fixture cannot accept lineup submissions.",
      `The fixture status is "${selected_fixture.status.replace(/_/g, " ")}". Only fixtures with "scheduled" status can receive new lineups.`,
      "Select a different fixture that is still scheduled.",
      true,
      FIXTURE_DATA_FAILURE_REASON.FIXTURE_UNAVAILABLE,
    );
  return { success: true, data: selected_fixture };
}

export async function load_fixture_competition(
  selected_fixture: Fixture,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureDataStep<Competition>> {
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    selected_fixture.competition_id,
  );
  if (!competition_result.success || !competition_result.data)
    return create_fixture_data_failure(
      "Failed to load competition for fixture.",
      "Competition data is required to determine lineup rules.",
      "Ensure the fixture has a valid competition, then retry.",
      false,
      FIXTURE_DATA_FAILURE_REASON.COMPETITION_UNAVAILABLE,
    );
  return { success: true, data: competition_result.data };
}

export async function load_fixture_related_records(
  fixture_id: string,
  selected_fixture: Fixture,
  competition: Competition,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureRelatedRecords> {
  const [organization, competition_teams, home_team, away_team, lineups] =
    await Promise.all([
      dependencies.organization_use_cases.get_by_id(
        competition.organization_id,
      ),
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
  return { organization, competition_teams, home_team, away_team, lineups };
}

export async function resolve_fixture_player_limits(
  organization_result: FixtureRelatedRecords["organization"],
  competition: Competition,
): Promise<FixtureLineupPlayerLimits> {
  const sport_id =
    organization_result.success && organization_result.data?.sport_id;
  const sport_result = sport_id ? await get_sport_by_id(sport_id) : void 0;
  const sport_limits =
    sport_result && sport_result.success && sport_result.data
      ? build_sport_player_limits(sport_result.data)
      : DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS;
  return apply_competition_player_limit_overrides(sport_limits, {
    ...competition.rule_overrides,
  });
}
