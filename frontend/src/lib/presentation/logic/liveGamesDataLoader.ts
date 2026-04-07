import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import { DEFAULT_TEAM_LOGO } from "$lib/core/entities/Team";
import {
  ANY_VALUE,
  build_authorization_list_filter,
  get_scope_value,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";

type ListResult<T> = Promise<{ success: boolean; data?: { items: T[] } }>;
type GetByIdResult<T> = Promise<{ success: boolean; data?: T }>;

export interface LiveGamesDataDependencies {
  organization_use_cases: {
    list(filter: Record<string, string>): ListResult<Organization>;
    get_by_id(organization_id: string): GetByIdResult<{
      id: string;
      sport_id: string;
    }>;
  };
  fixture_use_cases: {
    list(filter: Record<string, string>): ListResult<Fixture>;
  };
  team_use_cases: {
    get_by_id(team_id: string): GetByIdResult<{
      id: string;
      name: string;
      logo_url?: string;
      logo_image_url?: string;
      logo?: string;
    }>;
  };
  competition_use_cases: {
    get_by_id(competition_id: string): GetByIdResult<{
      id: string;
      name: string;
      organization_id: string;
    }>;
  };
  sport_use_cases: {
    get_by_id(sport_id: string): GetByIdResult<{ id: string; name: string }>;
  };
}

export interface LiveGamesFixtureState {
  fixtures: Fixture[];
  team_names: Record<string, string>;
  team_logo_urls: Record<string, string>;
  competition_names: Record<string, string>;
  sport_names: Record<string, string>;
}

export function can_user_change_live_games_organization(
  profile: UserScopeProfile | null,
): boolean {
  if (!profile) return false;
  return profile.organization_id === ANY_VALUE;
}

function build_live_games_auth_filter(
  profile: UserScopeProfile | null,
): Record<string, string> {
  if (!profile) return {};

  const filter = build_authorization_list_filter(profile, [
    "organization_id",
    "team_id",
  ]);
  if (profile.team_id && profile.team_id !== ANY_VALUE) {
    filter.team_id = profile.team_id;
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
      team_names[team_id] = "Unknown Team";
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
      competition_names[competition_id] = "Unknown Competition";
      sport_names[competition_id] = "Unknown Sport";
      continue;
    }

    competition_names[competition_id] = competition_result.data.name;
    const organization_result =
      await dependencies.organization_use_cases.get_by_id(
        competition_result.data.organization_id,
      );
    if (!organization_result.success || !organization_result.data) {
      sport_names[competition_id] = "Unknown Sport";
      continue;
    }

    const sport_result = await dependencies.sport_use_cases.get_by_id(
      organization_result.data.sport_id,
    );
    sport_names[competition_id] =
      sport_result.success && sport_result.data
        ? sport_result.data.name
        : "Unknown Sport";
  }

  return { competition_names, sport_names };
}

export async function load_live_games_organizations(
  dependencies: Pick<LiveGamesDataDependencies, "organization_use_cases">,
  profile: UserScopeProfile | null,
): Promise<Organization[]> {
  const result = await dependencies.organization_use_cases.list({});
  if (!result.success) return [];

  const organizations = result.data?.items || [];
  const organization_scope = get_scope_value(profile, "organization_id");
  if (!organization_scope || organization_scope === ANY_VALUE) {
    return organizations;
  }

  return organizations.filter(
    (organization) => organization.id === organization_scope,
  );
}

export async function load_live_games_fixture_state(
  dependencies: LiveGamesDataDependencies,
  profile: UserScopeProfile | null,
  organization_id: string,
): Promise<LiveGamesFixtureState> {
  const filter = build_live_games_auth_filter(profile);
  filter.organization_id = organization_id;

  const fixtures_result = await dependencies.fixture_use_cases.list(filter);
  const all_fixtures =
    fixtures_result.success && fixtures_result.data
      ? fixtures_result.data.items
      : [];
  const fixtures = all_fixtures.filter(
    (fixture) =>
      fixture.status !== "completed" && fixture.status !== "cancelled",
  );

  const { team_names, team_logo_urls } = await load_team_data_for_fixtures(
    fixtures,
    dependencies,
  );
  const { competition_names, sport_names } =
    await load_competition_sport_data_for_fixtures(fixtures, dependencies);

  return {
    fixtures,
    team_names,
    team_logo_urls,
    competition_names,
    sport_names,
  };
}
