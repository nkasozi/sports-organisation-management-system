import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Team } from "$lib/core/entities/Team";
import type {
  CardTypeConfig,
  MatchReportData,
  MatchStaffEntry,
} from "$lib/core/types/MatchReportTypes";
import {
  extract_goals_from_events,
  format_report_date,
  get_team_initials,
} from "$lib/core/types/MatchReportTypes";

import {
  DEFAULT_CARD_TYPES,
  MATCH_REPORT_DEFAULTS,
  REPORT_FILENAME_UNSAFE_CHARACTERS,
} from "./matchReportBuilderConstants";
import {
  build_officials_list,
  build_player_entries,
  type ReportTeamSide,
} from "./matchReportEntries";
import { calculate_score_by_period } from "./matchReportScoring";
import { SCORING_TEAM_SIDE } from "./matchReportScoringConstants";

const HOME_SIDE = SCORING_TEAM_SIDE.HOME;
const AWAY_SIDE = SCORING_TEAM_SIDE.AWAY;
export interface MatchReportBuildContext {
  fixture: Fixture;
  home_team: Team;
  away_team: Team;
  competition?: Competition;
  home_lineup: LineupPlayer[];
  away_lineup: LineupPlayer[];
  assigned_officials: Array<{ official: Official; role_name: string }>;
  home_staff?: MatchStaffEntry[];
  away_staff?: MatchStaffEntry[];
  card_types?: CardTypeConfig[];
  organization_name?: string;
  organization_logo_url?: string;
  venue_name?: string;
}

function resolve_fixture_year(fixture: Fixture): string {
  const reference_date = fixture.scheduled_date
    ? new Date(fixture.scheduled_date)
    : new Date();
  return reference_date.getFullYear().toString();
}

function build_report_team(
  ctx: MatchReportBuildContext,
  side: ReportTeamSide,
): MatchReportData["home_team"] {
  const team = side === HOME_SIDE ? ctx.home_team : ctx.away_team;
  const jersey =
    side === HOME_SIDE
      ? ctx.fixture.home_team_jersey
      : ctx.fixture.away_team_jersey;
  const staff = side === HOME_SIDE ? ctx.home_staff : ctx.away_staff;
  return {
    name: team.name,
    initials: get_team_initials(team.name),
    jersey_color:
      jersey?.main_color ||
      team.primary_color ||
      MATCH_REPORT_DEFAULTS.JERSEY_COLOR,
    staff: staff || [],
  };
}

function build_report_header_fields(
  ctx: MatchReportBuildContext,
): Pick<
  MatchReportData,
  | "league_name"
  | "organization_logo_url"
  | "competition_name"
  | "fixture_year"
  | "report_title"
  | "date"
  | "game_week"
  | "pool"
  | "match_number"
  | "scheduled_push_back"
  | "push_back_time"
> {
  const scheduled_time =
    ctx.fixture.scheduled_time || MATCH_REPORT_DEFAULTS.SCHEDULED_TIME;
  return {
    league_name: ctx.organization_name || MATCH_REPORT_DEFAULTS.LEAGUE_NAME,
    organization_logo_url:
      ctx.organization_logo_url || MATCH_REPORT_DEFAULTS.LOGO_URL,
    competition_name:
      ctx.competition?.name?.toUpperCase() ||
      MATCH_REPORT_DEFAULTS.COMPETITION_NAME,
    fixture_year: resolve_fixture_year(ctx.fixture),
    report_title: MATCH_REPORT_DEFAULTS.REPORT_TITLE,
    date: format_report_date(ctx.fixture.scheduled_date),
    game_week: ctx.fixture.match_day || MATCH_REPORT_DEFAULTS.GAME_WEEK,
    pool: ctx.fixture.round_name || MATCH_REPORT_DEFAULTS.POOL,
    match_number:
      ctx.fixture.round_number || MATCH_REPORT_DEFAULTS.MATCH_NUMBER,
    scheduled_push_back: scheduled_time,
    push_back_time: scheduled_time,
  };
}

function build_report_events(
  ctx: MatchReportBuildContext,
  card_types: CardTypeConfig[],
): Pick<
  MatchReportData,
  "score_by_period" | "home_players" | "away_players" | "goals"
> {
  const events = ctx.fixture.game_events;
  return {
    score_by_period: calculate_score_by_period(events),
    home_players: build_player_entries(
      ctx.home_lineup,
      events,
      HOME_SIDE,
      card_types,
    ),
    away_players: build_player_entries(
      ctx.away_lineup,
      events,
      AWAY_SIDE,
      card_types,
    ),
    goals: extract_goals_from_events(
      events,
      get_team_initials(ctx.home_team.name),
      get_team_initials(ctx.away_team.name),
      ctx.home_lineup,
      ctx.away_lineup,
    ),
  };
}

export function build_match_report_data(
  ctx: MatchReportBuildContext,
): MatchReportData {
  const card_types = ctx.card_types || DEFAULT_CARD_TYPES;
  return {
    ...build_report_header_fields(ctx),
    home_team: build_report_team(ctx, HOME_SIDE),
    away_team: build_report_team(ctx, AWAY_SIDE),
    final_score: {
      home: ctx.fixture.home_team_score ?? 0,
      away: ctx.fixture.away_team_score ?? 0,
    },
    ...build_report_events(ctx, card_types),
    officials: build_officials_list(ctx.assigned_officials),
    remarks: ctx.fixture.notes || MATCH_REPORT_DEFAULTS.REMARKS,
    venue_name:
      ctx.venue_name || ctx.fixture.venue || MATCH_REPORT_DEFAULTS.VENUE_NAME,
    card_types,
  };
}

export function generate_match_report_filename(
  home_team_name: string,
  away_team_name: string,
  date: string,
): string {
  const clean_home = home_team_name.replace(
    REPORT_FILENAME_UNSAFE_CHARACTERS,
    "_",
  );
  const clean_away = away_team_name.replace(
    REPORT_FILENAME_UNSAFE_CHARACTERS,
    "_",
  );
  const clean_date = date.replace(REPORT_FILENAME_UNSAFE_CHARACTERS, "_");
  return `Match_Report_${clean_home}_vs_${clean_away}_${clean_date}.pdf`;
}
