import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { type Option, OptionStatus } from "$lib/core/types/Option";
import {
  type LiveGameDetailBundle,
  normalize_lineup_players,
} from "$lib/presentation/logic/liveGameDetailState";

import {
  type LiveGameDetailAssignedOfficial,
  type LiveGameDetailCompetitionContext,
  type LiveGameDetailDataDependencies,
  type LiveGameDetailTeamsAndLineups,
  load_live_game_detail_assigned_officials,
  load_live_game_detail_competition_context,
  load_live_game_detail_teams_and_lineups,
  load_live_game_detail_venue,
} from "./liveGameDetailDataLoaders";

export type { LiveGameDetailDataDependencies } from "./liveGameDetailDataLoaders";

const FAILED_TO_LOAD_FIXTURE_MESSAGE =
  "We couldn't load this game. Please refresh the page to try again.";
const LIVE_GAME_DETAIL_FIXTURE_LOAD_FAILED_EVENT =
  "live_game_detail_fixture_load_failed";
const SECONDS_PER_MINUTE = 60;

type LiveGameDetailBundleSources = {
  fixture: Fixture;
  teams_and_lineups: LiveGameDetailTeamsAndLineups;
  competition_context: LiveGameDetailCompetitionContext;
  venue: Awaited<ReturnType<typeof load_live_game_detail_venue>>;
  assigned_officials_data: LiveGameDetailAssignedOfficial[];
};

function build_lineup_players(
  lineup: LiveGameDetailTeamsAndLineups["home_lineup"],
): LineupPlayer[] {
  return lineup.status === OptionStatus.SOME
    ? normalize_lineup_players(lineup.value.selected_players as LineupPlayer[])
    : [];
}

function read_lineup_id(
  lineup: LiveGameDetailTeamsAndLineups["home_lineup"],
): string {
  return lineup.status === OptionStatus.SOME ? lineup.value.id : "";
}

function to_bundle_entry<FieldName extends string, EntityType>(
  field_name: FieldName,
  option: Option<EntityType>,
): Partial<Record<FieldName, EntityType>> {
  if (option.status === OptionStatus.NONE) return {};
  return { [field_name]: option.value } as Record<FieldName, EntityType>;
}

function build_live_game_detail_bundle(
  sources: LiveGameDetailBundleSources,
): LiveGameDetailBundle {
  const { fixture, teams_and_lineups, competition_context } = sources;
  const { home_lineup, away_lineup } = teams_and_lineups;
  const organization = competition_context.organization;
  return {
    fixture,
    ...to_bundle_entry("home_team", teams_and_lineups.home_team),
    ...to_bundle_entry("away_team", teams_and_lineups.away_team),
    ...to_bundle_entry("competition", competition_context.competition),
    ...to_bundle_entry("sport", competition_context.sport),
    organization_name:
      organization.status === OptionStatus.SOME ? organization.value.name : "",
    ...to_bundle_entry("venue", sources.venue),
    assigned_officials_data: sources.assigned_officials_data,
    home_players: build_lineup_players(home_lineup),
    away_players: build_lineup_players(away_lineup),
    home_lineup_id: read_lineup_id(home_lineup),
    away_lineup_id: read_lineup_id(away_lineup),
    game_clock_seconds:
      fixture.status === FIXTURE_STATUS.IN_PROGRESS
        ? (fixture.current_minute || 0) * SECONDS_PER_MINUTE
        : 0,
  } as LiveGameDetailBundle;
}

async function load_live_game_detail_fixture(
  fixture_id: string,
  dependencies: LiveGameDetailDataDependencies,
): Promise<
  { success: true; data: Fixture } | { success: false; error_message: string }
> {
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success) {
    console.error("[LiveGameDetail] Failed to load fixture", {
      event: LIVE_GAME_DETAIL_FIXTURE_LOAD_FAILED_EVENT,
      fixture_id,
      error: fixture_result.error,
    });
    return { success: false, error_message: FAILED_TO_LOAD_FIXTURE_MESSAGE };
  }
  return fixture_result.data
    ? { success: true, data: fixture_result.data }
    : { success: false, error_message: FAILED_TO_LOAD_FIXTURE_MESSAGE };
}

export async function load_live_game_detail_bundle(
  fixture_id: string,
  dependencies: LiveGameDetailDataDependencies,
): Promise<
  | { success: true; data: LiveGameDetailBundle }
  | { success: false; error_message: string }
> {
  const fixture_result = await load_live_game_detail_fixture(
    fixture_id,
    dependencies,
  );
  if (!fixture_result.success) return fixture_result;
  const fixture = fixture_result.data;
  const teams_and_lineups = await load_live_game_detail_teams_and_lineups(
    fixture_id,
    fixture,
    dependencies,
  );
  const competition_context = await load_live_game_detail_competition_context(
    fixture,
    dependencies,
  );
  const venue = await load_live_game_detail_venue(fixture, dependencies);
  const assigned_officials_data =
    await load_live_game_detail_assigned_officials(fixture, dependencies);
  return {
    success: true,
    data: build_live_game_detail_bundle({
      fixture,
      teams_and_lineups,
      competition_context,
      venue,
      assigned_officials_data,
    }),
  };
}
