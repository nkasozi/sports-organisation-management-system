import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import { get_official_full_name } from "$lib/core/entities/Official";
import type {
  CardTypeConfig,
  MatchOfficialInfo,
  MatchPlayerEntry,
} from "$lib/core/types/MatchReportTypes";
import { build_match_player_entry } from "$lib/core/types/MatchReportTypes";

import { OFFICIAL_ROLE_DISPLAY_NAMES } from "./matchReportBuilderConstants";

export type ReportTeamSide = "home" | "away";

export function build_player_entries(
  players: LineupPlayer[],
  game_events: GameEvent[],
  team_side: ReportTeamSide,
  card_types: CardTypeConfig[],
): MatchPlayerEntry[] {
  const starters = players.filter((p) => !p.is_substitute);
  const substitutes = players.filter((p) => p.is_substitute);
  return [...starters, ...substitutes].map((player) =>
    build_match_player_entry(player, game_events, team_side, card_types),
  );
}

export function build_officials_list(
  assigned_officials: Array<{ official: Official; role_name: string }>,
): MatchOfficialInfo[] {
  return assigned_officials.map((assignment) => ({
    role: map_official_role_display(assignment.role_name),
    name: get_official_full_name(assignment.official),
  }));
}

function map_official_role_display(role_name: string): string {
  return OFFICIAL_ROLE_DISPLAY_NAMES[role_name.toLowerCase()] || role_name;
}
