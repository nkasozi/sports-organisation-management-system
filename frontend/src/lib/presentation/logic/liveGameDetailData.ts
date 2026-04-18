import type { Competition } from "$lib/core/entities/Competition";
import type {
  FixtureLineup,
  LineupPlayer,
} from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Organization } from "$lib/core/entities/Organization";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";
import {
  get_competition_use_cases,
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
  get_sport_use_cases,
  get_team_use_cases,
  get_venue_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";
import {
  type LiveGameDetailBundle,
  normalize_lineup_players,
} from "$lib/presentation/logic/liveGameDetailState";

type FixtureUseCases = ReturnType<typeof get_fixture_use_cases>;
type TeamUseCases = ReturnType<typeof get_team_use_cases>;
type FixtureLineupUseCases = ReturnType<typeof get_fixture_lineup_use_cases>;
type CompetitionUseCases = ReturnType<typeof get_competition_use_cases>;
type OrganizationUseCases = ReturnType<typeof get_organization_use_cases>;
type SportUseCases = ReturnType<typeof get_sport_use_cases>;
type VenueUseCases = ReturnType<typeof get_venue_use_cases>;
type OfficialUseCases = ReturnType<typeof get_official_use_cases>;

export interface LiveGameDetailDataDependencies {
  fixture_use_cases: FixtureUseCases;
  team_use_cases: TeamUseCases;
  fixture_lineup_use_cases: FixtureLineupUseCases;
  competition_use_cases: CompetitionUseCases;
  organization_use_cases: OrganizationUseCases;
  sport_use_cases: SportUseCases;
  venue_use_cases: VenueUseCases;
  official_use_cases: OfficialUseCases;
}

function extract_success_data<EntityType>(result: {
  success: boolean;
  data?: unknown;
}): EntityType | false {
  if (!result.success || !result.data) {
    return false;
  }

  return result.data as EntityType;
}

export async function load_live_game_detail_bundle(
  fixture_id: string,
  dependencies: LiveGameDetailDataDependencies,
): Promise<
  | { success: true; data: LiveGameDetailBundle }
  | { success: false; error_message: string }
> {
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data)
    return {
      success: false,
      error_message: fixture_result.success
        ? "Failed to load fixture"
        : fixture_result.error || "Failed to load fixture",
    };
  const fixture = fixture_result.data;
  const [home_result, away_result, home_lineup_result, away_lineup_result] =
    await Promise.all([
      dependencies.team_use_cases.get_by_id(fixture.home_team_id),
      dependencies.team_use_cases.get_by_id(fixture.away_team_id),
      dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        fixture.home_team_id,
      ),
      dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        fixture.away_team_id,
      ),
    ]);
  const competition_result = fixture.competition_id
    ? await dependencies.competition_use_cases.get_by_id(fixture.competition_id)
    : { success: false };
  const competition_result_data =
    extract_success_data<Competition>(competition_result);
  const competition = competition_result_data || undefined;
  const organization_result = competition?.organization_id
    ? await dependencies.organization_use_cases.get_by_id(
        competition.organization_id,
      )
    : { success: false };
  const organization_result_data =
    extract_success_data<Organization>(organization_result);
  const organization = organization_result_data || undefined;
  const organization_name = organization?.name ?? "";
  const sport_result = organization?.sport_id
    ? await dependencies.sport_use_cases.get_by_id(organization.sport_id)
    : { success: false };
  const venue_result = fixture.venue
    ? await dependencies.venue_use_cases.get_by_id(fixture.venue)
    : { success: false };
  const assigned_officials_data = fixture.assigned_officials?.length
    ? (
        await Promise.all(
          fixture.assigned_officials.map(async (assignment) => {
            const official_result =
              await dependencies.official_use_cases.get_by_id(
                assignment.official_id,
              );
            return official_result.success && official_result.data
              ? {
                  official: official_result.data as Official,
                  role_name: String(assignment.role_name),
                }
              : false;
          }),
        )
      ).filter(
        (assignment): assignment is { official: Official; role_name: string } =>
          Boolean(assignment),
      )
    : [];
  const home_lineup_result_data =
    extract_success_data<FixtureLineup>(home_lineup_result);
  const away_lineup_result_data =
    extract_success_data<FixtureLineup>(away_lineup_result);
  const home_team_result_data = extract_success_data<Team>(home_result);
  const away_team_result_data = extract_success_data<Team>(away_result);
  const sport_result_data = extract_success_data<Sport>(sport_result);
  const venue_result_data = extract_success_data<Venue>(venue_result);
  const home_lineup = home_lineup_result_data || undefined;
  const away_lineup = away_lineup_result_data || undefined;
  const home_team = home_team_result_data || undefined;
  const away_team = away_team_result_data || undefined;
  const sport = sport_result_data || undefined;
  const venue = venue_result_data || undefined;
  return {
    success: true,
    data: {
      fixture,
      home_team: home_team ?? void 0,
      away_team: away_team ?? void 0,
      competition: competition ?? void 0,
      sport: sport ?? void 0,
      organization_name,
      venue: venue ?? void 0,
      assigned_officials_data,
      home_players: home_lineup
        ? normalize_lineup_players(
            home_lineup.selected_players as LineupPlayer[],
          )
        : [],
      away_players: away_lineup
        ? normalize_lineup_players(
            away_lineup.selected_players as LineupPlayer[],
          )
        : [],
      home_lineup_id: home_lineup?.id || "",
      away_lineup_id: away_lineup?.id || "",
      game_clock_seconds:
        fixture.status === "in_progress"
          ? (fixture.current_minute || 0) * 60
          : 0,
    } as LiveGameDetailBundle,
  };
}
