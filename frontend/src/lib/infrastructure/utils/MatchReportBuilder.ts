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
  MatchScoreByPeriod,
  MatchStaffEntry,
} from "$lib/core/types/MatchReportTypes";
import {
  build_match_player_entry,
  extract_goals_from_events,
  format_report_date,
  get_team_initials,
} from "$lib/core/types/MatchReportTypes";

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
  organization_name?: string;
  organization_logo_url?: string;
  venue_name?: string;
}

export function build_match_report_data(ctx: MatchReportBuildContext): MatchReportData {
  const home_initials = get_team_initials(ctx.home_team.name);
  const away_initials = get_team_initials(ctx.away_team.name);

  const home_players = build_player_entries(ctx.home_lineup, ctx.fixture.game_events, "home");
  const away_players = build_player_entries(ctx.away_lineup, ctx.fixture.game_events, "away");

  const officials = build_officials_list(ctx.assigned_officials);

  const goals = extract_goals_from_events(
    ctx.fixture.game_events,
    home_initials,
    away_initials,
    ctx.home_lineup,
    ctx.away_lineup,
  );

  const score_by_period = calculate_score_by_period(ctx.fixture.game_events, home_initials, away_initials);

  const scheduled_time = ctx.fixture.scheduled_time || "00:00";

  return {
    league_name: ctx.organization_name || "SPORTS ORGANIZATION",
    organization_logo_url: ctx.organization_logo_url || "",
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
      jersey_color: ctx.fixture.home_team_jersey?.main_color || ctx.home_team.primary_color || "Unknown",
      staff: ctx.home_staff || [],
    },
    away_team: {
      name: ctx.away_team.name,
      initials: away_initials,
      jersey_color: ctx.fixture.away_team_jersey?.main_color || ctx.away_team.primary_color || "Unknown",
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
  };
}

function build_player_entries(
  players: LineupPlayer[],
  game_events: GameEvent[],
  team_side: "home" | "away",
): MatchPlayerEntry[] {
  const entries: MatchPlayerEntry[] = [];

  const starters = players.filter((p) => !p.is_substitute);
  const substitutes = players.filter((p) => p.is_substitute);

  for (const player of starters) {
    entries.push(build_match_player_entry(player, game_events, team_side));
  }

  for (const player of substitutes) {
    entries.push(build_match_player_entry(player, game_events, team_side));
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

function calculate_score_by_period(
  game_events: GameEvent[],
  home_initials: string,
  away_initials: string,
): MatchScoreByPeriod[] {
  const goal_types = ["goal", "own_goal", "penalty_scored"];

  const period_scores: Record<string, { home: number; away: number }> = {
    first_half: { home: 0, away: 0 },
    second_half: { home: 0, away: 0 },
    extra_time_first: { home: 0, away: 0 },
    extra_time_second: { home: 0, away: 0 },
  };

  for (const event of game_events) {
    if (!goal_types.includes(event.event_type)) continue;

    const period = infer_period_from_minute(event.minute);
    if (!period_scores[period]) continue;

    const is_home_goal = event.team_side === "home" && event.event_type !== "own_goal";
    const is_away_own_goal = event.team_side === "away" && event.event_type === "own_goal";

    if (is_home_goal || is_away_own_goal) {
      period_scores[period].home++;
    } else {
      period_scores[period].away++;
    }
  }

  const periods: MatchScoreByPeriod[] = [];

  let cumulative_home = 0;
  let cumulative_away = 0;

  if (period_scores.first_half.home > 0 || period_scores.first_half.away > 0 || true) {
    cumulative_home += period_scores.first_half.home;
    cumulative_away += period_scores.first_half.away;
    periods.push({ period_name: "First Period", home_score: cumulative_home, away_score: cumulative_away });
  }

  cumulative_home += period_scores.second_half.home;
  cumulative_away += period_scores.second_half.away;
  periods.push({ period_name: "Half-time", home_score: cumulative_home, away_score: cumulative_away });

  if (
    period_scores.extra_time_first.home > 0 ||
    period_scores.extra_time_first.away > 0 ||
    period_scores.extra_time_second.home > 0 ||
    period_scores.extra_time_second.away > 0
  ) {
    cumulative_home += period_scores.extra_time_first.home + period_scores.extra_time_second.home;
    cumulative_away += period_scores.extra_time_first.away + period_scores.extra_time_second.away;
    periods.push({ period_name: "Third Period", home_score: cumulative_home, away_score: cumulative_away });
  }

  return periods;
}

function infer_period_from_minute(minute: number): string {
  if (minute <= 45) return "first_half";
  if (minute <= 90) return "second_half";
  if (minute <= 105) return "extra_time_first";
  return "extra_time_second";
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
