import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { Competition } from "$lib/core/entities/Competition";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import { get_official_full_name } from "$lib/core/entities/Official";
import type {
  MatchReportData,
  MatchPlayerEntry,
  MatchOfficialInfo,
  MatchStaffEntry,
  CardTypeConfig,
} from "$lib/core/types/MatchReportTypes";
import {
  build_match_player_entry,
  extract_goals_from_events,
  format_report_date,
  get_team_initials,
} from "$lib/core/types/MatchReportTypes";
import { calculate_score_by_period } from "./matchReportScoring";

export interface MatchReportBuildContext {
  fixture: Fixture;
  home_team: Team;
  away_team: Team;
  competition: Competition | null;
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

const DEFAULT_CARD_TYPES: CardTypeConfig[] = [
  { id: "green", name: "Green", color: "#00FF00", event_type: "green_card" },
  { id: "yellow", name: "Yellow", color: "#FFFF00", event_type: "yellow_card" },
  { id: "red", name: "Red", color: "#FF0000", event_type: "red_card" },
];

export function build_match_report_data(
  ctx: MatchReportBuildContext,
): MatchReportData {
  const home_initials = get_team_initials(ctx.home_team.name);
  const away_initials = get_team_initials(ctx.away_team.name);

  const card_types = ctx.card_types || DEFAULT_CARD_TYPES;

  const home_players = build_player_entries(
    ctx.home_lineup,
    ctx.fixture.game_events,
    "home",
    card_types,
  );
  const away_players = build_player_entries(
    ctx.away_lineup,
    ctx.fixture.game_events,
    "away",
    card_types,
  );

  const officials = build_officials_list(ctx.assigned_officials);

  const goals = extract_goals_from_events(
    ctx.fixture.game_events,
    home_initials,
    away_initials,
    ctx.home_lineup,
    ctx.away_lineup,
  );

  const score_by_period = calculate_score_by_period(
    ctx.fixture.game_events,
    home_initials,
    away_initials,
  );

  const scheduled_time = ctx.fixture.scheduled_time || "00:00";

  const fixture_year = ctx.fixture.scheduled_date
    ? new Date(ctx.fixture.scheduled_date).getFullYear().toString()
    : new Date().getFullYear().toString();

  return {
    league_name: ctx.organization_name || "SPORT-SYNC",
    organization_logo_url: ctx.organization_logo_url || "",
    competition_name: ctx.competition?.name?.toUpperCase() || "COMPETITION",
    fixture_year,
    report_title: "MATCH REPORT",
    date: format_report_date(ctx.fixture.scheduled_date),
    game_week: ctx.fixture.match_day || 1,
    pool: ctx.fixture.round_name || "Group Stage",
    match_number: ctx.fixture.round_number || 1,
    scheduled_push_back: scheduled_time,
    push_back_time: scheduled_time,
    home_team: {
      name: ctx.home_team.name,
      initials: home_initials,
      jersey_color:
        ctx.fixture.home_team_jersey?.main_color ||
        ctx.home_team.primary_color ||
        "Unknown",
      staff: ctx.home_staff || [],
    },
    away_team: {
      name: ctx.away_team.name,
      initials: away_initials,
      jersey_color:
        ctx.fixture.away_team_jersey?.main_color ||
        ctx.away_team.primary_color ||
        "Unknown",
      staff: ctx.away_staff || [],
    },
    final_score: {
      home: ctx.fixture.home_team_score ?? 0,
      away: ctx.fixture.away_team_score ?? 0,
    },
    score_by_period,
    home_players,
    away_players,
    officials,
    goals,
    remarks: ctx.fixture.notes || "",
    venue_name: ctx.venue_name || ctx.fixture.venue || "Unknown Venue",
    card_types,
  };
}

function build_player_entries(
  players: LineupPlayer[],
  game_events: GameEvent[],
  team_side: "home" | "away",
  card_types: CardTypeConfig[],
): MatchPlayerEntry[] {
  const entries: MatchPlayerEntry[] = [];

  const starters = players.filter((p) => !p.is_substitute);
  const substitutes = players.filter((p) => p.is_substitute);

  for (const player of starters) {
    entries.push(
      build_match_player_entry(player, game_events, team_side, card_types),
    );
  }

  for (const player of substitutes) {
    entries.push(
      build_match_player_entry(player, game_events, team_side, card_types),
    );
  }

  return entries;
}

function build_officials_list(
  assigned_officials: Array<{ official: Official; role_name: string }>,
): MatchOfficialInfo[] {
  const officials: MatchOfficialInfo[] = [];

  for (const assignment of assigned_officials) {
    officials.push({
      role: map_official_role_display(assignment.role_name),
      name: get_official_full_name(assignment.official),
    });
  }

  return officials;
}

function map_official_role_display(role_name: string): string {
  const role_map: Record<string, string> = {
    referee: "Referee",
    umpire: "Umpire",
    assistant_referee: "Assistant Referee",
    fourth_official: "Fourth Official",
    reserve_umpire: "Reserve Umpire",
    judge: "Judge",
    technical_officer: "Technical Officer",
    var_official: "VAR",
    linesman: "Linesman",
    scorer: "Scorer",
    timekeeper: "Timekeeper",
  };

  return role_map[role_name.toLowerCase()] || role_name;
}

export function generate_match_report_filename(
  home_team_name: string,
  away_team_name: string,
  date: string,
): string {
  const clean_home = home_team_name.replace(/[^a-zA-Z0-9]/g, "_");
  const clean_away = away_team_name.replace(/[^a-zA-Z0-9]/g, "_");
  const clean_date = date.replace(/[^a-zA-Z0-9]/g, "_");
  return `Match_Report_${clean_home}_vs_${clean_away}_${clean_date}.pdf`;
}
