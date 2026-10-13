import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Organization } from "$lib/core/entities/Organization";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import type {
  get_competition_use_cases,
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
  get_sport_use_cases,
  get_team_use_cases,
  get_venue_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export interface LiveGameDetailDataDependencies {
  fixture_use_cases: ReturnType<typeof get_fixture_use_cases>;
  team_use_cases: ReturnType<typeof get_team_use_cases>;
  fixture_lineup_use_cases: ReturnType<typeof get_fixture_lineup_use_cases>;
  competition_use_cases: ReturnType<typeof get_competition_use_cases>;
  organization_use_cases: ReturnType<typeof get_organization_use_cases>;
  sport_use_cases: ReturnType<typeof get_sport_use_cases>;
  venue_use_cases: ReturnType<typeof get_venue_use_cases>;
  official_use_cases: ReturnType<typeof get_official_use_cases>;
}

export type LiveGameDetailAssignedOfficial = {
  official: Official;
  role_name: string;
};

export type LiveGameDetailTeamsAndLineups = {
  home_team: Option<Team>;
  away_team: Option<Team>;
  home_lineup: Option<FixtureLineup>;
  away_lineup: Option<FixtureLineup>;
};

export type LiveGameDetailCompetitionContext = {
  competition: Option<Competition>;
  organization: Option<Organization>;
  sport: Option<Sport>;
};

const FAILED_LOOKUP_RESULT = { success: false };

function extract_success_data<EntityType>(result: {
  success: boolean;
  data?: unknown;
}): Option<EntityType> {
  if (!result.success || !result.data) return create_none_option();
  return create_some_option(result.data as EntityType);
}

export async function load_live_game_detail_teams_and_lineups(
  fixture_id: string,
  fixture: Fixture,
  dependencies: LiveGameDetailDataDependencies,
): Promise<LiveGameDetailTeamsAndLineups> {
  const lineup_use_cases = dependencies.fixture_lineup_use_cases;
  const [home_result, away_result, home_lineup_result, away_lineup_result] =
    await Promise.all([
      dependencies.team_use_cases.get_by_id(fixture.home_team_id),
      dependencies.team_use_cases.get_by_id(fixture.away_team_id),
      lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        fixture.home_team_id,
      ),
      lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        fixture.away_team_id,
      ),
    ]);
  return {
    home_team: extract_success_data<Team>(home_result),
    away_team: extract_success_data<Team>(away_result),
    home_lineup: extract_success_data<FixtureLineup>(home_lineup_result),
    away_lineup: extract_success_data<FixtureLineup>(away_lineup_result),
  };
}

export async function load_live_game_detail_competition_context(
  fixture: Fixture,
  dependencies: LiveGameDetailDataDependencies,
): Promise<LiveGameDetailCompetitionContext> {
  const competition_result = fixture.competition_id
    ? await dependencies.competition_use_cases.get_by_id(fixture.competition_id)
    : FAILED_LOOKUP_RESULT;
  const competition = extract_success_data<Competition>(competition_result);
  const organization_result =
    competition.status === OptionStatus.SOME &&
    competition.value.organization_id
      ? await dependencies.organization_use_cases.get_by_id(
          competition.value.organization_id,
        )
      : FAILED_LOOKUP_RESULT;
  const organization = extract_success_data<Organization>(organization_result);
  const sport_result =
    organization.status === OptionStatus.SOME && organization.value.sport_id
      ? await dependencies.sport_use_cases.get_by_id(
          organization.value.sport_id,
        )
      : FAILED_LOOKUP_RESULT;
  return {
    competition,
    organization,
    sport: extract_success_data<Sport>(sport_result),
  };
}

export async function load_live_game_detail_venue(
  fixture: Fixture,
  dependencies: LiveGameDetailDataDependencies,
): Promise<Option<Venue>> {
  const venue_result = fixture.venue
    ? await dependencies.venue_use_cases.get_by_id(fixture.venue)
    : FAILED_LOOKUP_RESULT;
  return extract_success_data<Venue>(venue_result);
}

async function load_assigned_official(
  assignment: NonNullable<Fixture["assigned_officials"]>[number],
  dependencies: LiveGameDetailDataDependencies,
): Promise<LiveGameDetailAssignedOfficial[]> {
  const official_result = await dependencies.official_use_cases.get_by_id(
    assignment.official_id,
  );
  return official_result.success && official_result.data
    ? [
        {
          official: official_result.data as Official,
          role_name: String(assignment.role_name),
        },
      ]
    : [];
}

export async function load_live_game_detail_assigned_officials(
  fixture: Fixture,
  dependencies: LiveGameDetailDataDependencies,
): Promise<LiveGameDetailAssignedOfficial[]> {
  if (!fixture.assigned_officials?.length) return [];
  const loaded_assignments = await Promise.all(
    fixture.assigned_officials.map((assignment) =>
      load_assigned_official(assignment, dependencies),
    ),
  );
  return loaded_assignments.flat();
}
