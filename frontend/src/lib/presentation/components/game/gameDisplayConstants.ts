import type { TeamSide } from "$lib/core/entities/GameEventLogTypes";

export const GAME_EVENT_TEAM_SIDE = {
  HOME: "home",
  AWAY: "away",
  MATCH: "match",
} as const satisfies Record<string, TeamSide>;

export type GameTeamSide = Exclude<TeamSide, typeof GAME_EVENT_TEAM_SIDE.MATCH>;

export const GAME_EVENT_TEAM_SIDE_STYLE = {
  HOME_TEXT: "text-blue-600",
  AWAY_TEXT: "text-red-600",
} as const;

export function get_selected_team_side_class(team_side: string): string {
  return team_side === GAME_EVENT_TEAM_SIDE.HOME
    ? GAME_EVENT_TEAM_SIDE_STYLE.HOME_TEXT
    : GAME_EVENT_TEAM_SIDE_STYLE.AWAY_TEXT;
}

export function get_selected_team_side_label(
  team_side: string,
  home_team_name: string,
  away_team_name: string,
): string {
  return team_side === GAME_EVENT_TEAM_SIDE.HOME
    ? `🏠 ${home_team_name}`
    : `✈️ ${away_team_name}`;
}
