import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import type { Team } from "$lib/core/entities/Team";
import { type Option, OptionStatus } from "$lib/core/types/Option";

import { get_fixture_display_name } from "./fixtureLineupCreateState";

interface FixtureLineupCreateFixtureSelectionParams {
  organization_id: string;
  fixtures: Fixture[];
  all_teams: Team[];
  all_competitions: Competition[];
  fixtures_with_complete_lineups: Set<string>;
  team_is_restricted: boolean;
  user_team: Option<string>;
}

export interface FixtureLineupCreateFixtureSelectOption {
  value: string;
  label: string;
  group: string;
}

interface FixtureLineupCreateFixtureSelectionState {
  all_fixtures_for_org: Fixture[];
  fixtures_for_user_team: Fixture[];
  non_scheduled_fixtures_count: number;
  fixtures_for_organization: Fixture[];
  fixture_select_options: FixtureLineupCreateFixtureSelectOption[];
}

function filter_fixtures_for_user_team(
  fixtures: Fixture[],
  team_is_restricted: boolean,
  user_team: Option<string>,
): Fixture[] {
  if (!team_is_restricted) return fixtures;
  if (user_team.status === OptionStatus.NONE) return fixtures;
  return fixtures.filter(
    (fixture: Fixture) =>
      fixture.home_team_id === user_team.value ||
      fixture.away_team_id === user_team.value,
  );
}

function build_fixture_lineup_create_fixture_select_options(
  fixtures: Fixture[],
  all_teams: Team[],
  all_competitions: Competition[],
): FixtureLineupCreateFixtureSelectOption[] {
  return fixtures.map((fixture: Fixture) => ({
    value: fixture.id,
    label: get_fixture_display_name(fixture, all_teams, all_competitions),
    group:
      all_competitions.find(
        (competition: Competition) => competition.id === fixture.competition_id,
      )?.name || "",
  }));
}

export function build_fixture_lineup_create_fixture_selection_state(
  params: FixtureLineupCreateFixtureSelectionParams,
): FixtureLineupCreateFixtureSelectionState {
  const all_fixtures_for_org = params.organization_id
    ? params.fixtures.filter(
        (fixture: Fixture) =>
          fixture.organization_id === params.organization_id,
      )
    : params.fixtures;
  const fixtures_for_user_team = filter_fixtures_for_user_team(
    all_fixtures_for_org,
    params.team_is_restricted,
    params.user_team,
  );
  const fixtures_for_organization = fixtures_for_user_team.filter(
    (fixture: Fixture) =>
      fixture.status === FIXTURE_STATUS.SCHEDULED &&
      !params.fixtures_with_complete_lineups.has(fixture.id),
  );
  return {
    all_fixtures_for_org,
    fixtures_for_user_team,
    non_scheduled_fixtures_count: fixtures_for_user_team.filter(
      (fixture: Fixture) => fixture.status !== FIXTURE_STATUS.SCHEDULED,
    ).length,
    fixtures_for_organization,
    fixture_select_options: build_fixture_lineup_create_fixture_select_options(
      fixtures_for_organization,
      params.all_teams,
      params.all_competitions,
    ),
  };
}
