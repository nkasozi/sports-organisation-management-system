import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

const LINEUP_WIZARD_STEP_INDEX = {
  ORGANIZATION: 0,
  FIXTURE: 1,
  TEAM: 2,
  PLAYERS: 3,
} as const;

interface WizardAutoSkipInput {
  organization_is_restricted: boolean;
  organization_id: string;
  has_selected_organization: boolean;
}

export function determine_initial_wizard_step(
  input: WizardAutoSkipInput,
): number {
  if (
    input.organization_is_restricted &&
    input.organization_id &&
    input.has_selected_organization
  ) {
    return LINEUP_WIZARD_STEP_INDEX.FIXTURE;
  }
  return LINEUP_WIZARD_STEP_INDEX.ORGANIZATION;
}

interface TeamAutoSelectResult {
  has_selected_team: boolean;
  team_players_count: number;
}

export function determine_step_after_team_auto_selected(
  result: TeamAutoSelectResult,
): number {
  if (result.has_selected_team && result.team_players_count > 0) {
    return LINEUP_WIZARD_STEP_INDEX.PLAYERS;
  }
  return LINEUP_WIZARD_STEP_INDEX.TEAM;
}

export function build_error_message(
  error: string,
  why: string,
  how_to_fix: string,
): string {
  const normalized_error = error.trim();
  const normalized_why = why.trim();
  const normalized_fix = how_to_fix.trim();

  return `${normalized_error}\nWhy: ${normalized_why}\nHow to fix: ${normalized_fix}`;
}

export function derive_initial_selected_player_ids(
  team_players: TeamPlayer[],
  max_players: number,
): Array<TeamPlayer["id"]> {
  const limit = Math.max(0, max_players);
  return team_players.slice(0, limit).map((player) => player.id);
}

export function derive_initial_selected_players(
  team_players: TeamPlayer[],
  max_players: number,
): LineupPlayer[] {
  const limit = Math.max(0, max_players);
  return team_players
    .slice(0, limit)
    .map((player) => convert_team_player_to_lineup_player(player));
}

export function convert_team_player_to_lineup_player(
  team_player: TeamPlayer,
  is_captain: boolean = false,
  is_substitute: boolean = false,
): LineupPlayer {
  return {
    id: team_player.id,
    first_name: team_player.first_name,
    last_name: team_player.last_name,
    jersey_number: team_player.jersey_number,
    position: team_player.position as LineupPlayer["position"],
    is_captain,
    is_substitute,
  };
}

export function convert_team_players_to_lineup_players(
  team_players: TeamPlayer[],
  selected_player_ids: string[],
): LineupPlayer[] {
  const selected_set = new Set(selected_player_ids);
  return team_players
    .filter((player) => selected_set.has(player.id))
    .map((player) => convert_team_player_to_lineup_player(player));
}

type SortableLineupPlayer = {
  jersey_number: number;
  first_name: string;
  last_name: string;
  position?: string;
};

function compare_jersey_numbers(a: number, b: number): number {
  const a_value = a > 0 ? a : Number.POSITIVE_INFINITY;
  const b_value = b > 0 ? b : Number.POSITIVE_INFINITY;
  return a_value - b_value;
}

function compare_strings_case_insensitive(a: string, b: string): number {
  return a.localeCompare(b, [], { sensitivity: "base" });
}

function compare_by_jersey_then_name(
  a: SortableLineupPlayer,
  b: SortableLineupPlayer,
): number {
  const jersey_comparison = compare_jersey_numbers(
    a.jersey_number,
    b.jersey_number,
  );
  if (jersey_comparison !== 0) return jersey_comparison;
  return compare_strings_case_insensitive(
    `${a.first_name} ${a.last_name}`.trim(),
    `${b.first_name} ${b.last_name}`.trim(),
  );
}

export function summarize_selected_team_players(
  team_players: TeamPlayer[],
  selected_player_ids: string[],
): TeamPlayer[] {
  const selected_set = new Set(selected_player_ids);

  return team_players
    .filter((player) => selected_set.has(player.id))
    .sort(compare_by_jersey_then_name);
}

export function sort_lineup_players<TPlayer extends SortableLineupPlayer>(
  players: TPlayer[],
): TPlayer[] {
  return [...players].sort(compare_by_jersey_then_name);
}
