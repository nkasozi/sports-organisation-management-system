import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { DEFAULT_TEAM_LOGO } from "$lib/core/entities/Team";
import { ANY_VALUE } from "$lib/core/interfaces/ports";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import type {
  LiveGamesDataDependencies,
  LiveGamesFixtureState,
  LiveGamesProfileState,
} from "./liveGamesDataTypes";
import {
  LIVE_GAMES_DATA_EVENT,
  LIVE_GAMES_FALLBACK_LABEL,
  LIVE_GAMES_USER_MESSAGE,
} from "./liveGamesMessages";
import { PRESENCE_STATUS } from "./presenceStatus";

export type {
  LiveGamesFixtureState,
  LiveGamesProfileState,
} from "./liveGamesDataTypes";

export function can_user_change_live_games_organization(
  profile_state: LiveGamesProfileState,
): boolean {
  if (profile_state.status === PRESENCE_STATUS.MISSING) return false;
  return profile_state.profile.organization_id === ANY_VALUE;
}

function build_live_games_auth_filter(
  profile_state: LiveGamesProfileState,
): Record<string, string> {
  if (profile_state.status === PRESENCE_STATUS.MISSING) return {};

  const filter: Record<string, string> = {};
  if (profile_state.profile.organization_id !== ANY_VALUE) {
    filter.organization_id = profile_state.profile.organization_id;
  }
  if (profile_state.profile.team_id !== ANY_VALUE) {
    filter.team_id = profile_state.profile.team_id;
  }
  return filter;
}

async function load_team_data_for_fixtures(
  fixtures: Fixture[],
  dependencies: LiveGamesDataDependencies,
): Promise<Pick<LiveGamesFixtureState, "team_names" | "team_logo_urls">> {
  const team_names: Record<string, string> = {};
  const team_logo_urls: Record<string, string> = {};
  const team_ids = new Set<string>();

  for (const fixture of fixtures) {
    if (fixture.home_team_id) team_ids.add(fixture.home_team_id);
    if (fixture.away_team_id) team_ids.add(fixture.away_team_id);
  }

  for (const team_id of team_ids) {
    const team_result = await dependencies.team_use_cases.get_by_id(team_id);
    if (!team_result.success || !team_result.data) {
      team_names[team_id] = LIVE_GAMES_FALLBACK_LABEL.UNKNOWN_TEAM;
      team_logo_urls[team_id] = "";
      continue;
    }

    team_names[team_id] = team_result.data.name;
    team_logo_urls[team_id] = team_result.data.logo_url || DEFAULT_TEAM_LOGO;
  }

  return { team_names, team_logo_urls };
}

async function load_competition_sport_data_for_fixtures(
  fixtures: Fixture[],
  dependencies: LiveGamesDataDependencies,
): Promise<Pick<LiveGamesFixtureState, "competition_names" | "sport_names">> {
  const competition_names: Record<string, string> = {};
  const sport_names: Record<string, string> = {};
  const competition_ids = new Set<string>();

  for (const fixture of fixtures) {
    if (fixture.competition_id) competition_ids.add(fixture.competition_id);
  }

  for (const competition_id of competition_ids) {
    const competition_result =
      await dependencies.competition_use_cases.get_by_id(competition_id);
    if (!competition_result.success || !competition_result.data) {
      competition_names[competition_id] =
        LIVE_GAMES_FALLBACK_LABEL.UNKNOWN_COMPETITION;
      sport_names[competition_id] = LIVE_GAMES_FALLBACK_LABEL.UNKNOWN_SPORT;
      continue;
    }

    competition_names[competition_id] = competition_result.data.name;
    const organization_result =
      await dependencies.organization_use_cases.get_by_id(
        competition_result.data.organization_id,
      );
    if (!organization_result.success || !organization_result.data) {
      sport_names[competition_id] = LIVE_GAMES_FALLBACK_LABEL.UNKNOWN_SPORT;
      continue;
    }

    const sport_result = await dependencies.sport_use_cases.get_by_id(
      organization_result.data.sport_id,
    );
    sport_names[competition_id] =
      sport_result.success && sport_result.data
        ? sport_result.data.name
        : LIVE_GAMES_FALLBACK_LABEL.UNKNOWN_SPORT;
  }

  return { competition_names, sport_names };
}

function scope_organizations_to_profile(
  organizations: Organization[],
  profile_state: LiveGamesProfileState,
): Organization[] {
  if (profile_state.status === PRESENCE_STATUS.MISSING) return organizations;
  if (profile_state.profile.organization_id === ANY_VALUE) return organizations;
  return organizations.filter(
    (organization) => organization.id === profile_state.profile.organization_id,
  );
}

export async function load_live_games_organizations(
  dependencies: Pick<LiveGamesDataDependencies, "organization_use_cases">,
  profile_state: LiveGamesProfileState,
): AsyncResult<Organization[]> {
  const result = await dependencies.organization_use_cases.list({});
  if (!result.success) {
    console.error("[LiveGames] Failed to load organizations", {
      event: LIVE_GAMES_DATA_EVENT.ORGANIZATIONS_LOAD_FAILED,
    });
    return create_failure_result(
      LIVE_GAMES_USER_MESSAGE.ORGANIZATIONS_LOAD_FAILED,
    );
  }
  return create_success_result(
    scope_organizations_to_profile(result.data?.items ?? [], profile_state),
  );
}

function is_live_game_candidate(fixture: Fixture): boolean {
  return (
    fixture.status !== FIXTURE_STATUS.COMPLETED &&
    fixture.status !== FIXTURE_STATUS.CANCELLED
  );
}

export async function load_live_games_fixture_state(
  dependencies: LiveGamesDataDependencies,
  profile_state: LiveGamesProfileState,
  organization_id: string,
): AsyncResult<LiveGamesFixtureState> {
  const filter = build_live_games_auth_filter(profile_state);
  filter.organization_id = organization_id;
  const fixtures_result = await dependencies.fixture_use_cases.list(filter);
  if (!fixtures_result.success) {
    console.error("[LiveGames] Failed to load fixtures", {
      event: LIVE_GAMES_DATA_EVENT.FIXTURES_LOAD_FAILED,
      organization_id,
    });
    return create_failure_result(LIVE_GAMES_USER_MESSAGE.FIXTURES_LOAD_FAILED);
  }
  const fixtures = (fixtures_result.data?.items ?? []).filter(
    is_live_game_candidate,
  );
  const team_data = await load_team_data_for_fixtures(fixtures, dependencies);
  const competition_data = await load_competition_sport_data_for_fixtures(
    fixtures,
    dependencies,
  );
  return create_success_result({ fixtures, ...team_data, ...competition_data });
}
