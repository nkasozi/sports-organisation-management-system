import type { TeamPlayer } from "$lib/core/services/teamPlayers";

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
): string[] {
  const limit = Math.max(0, max_players);
  return team_players.slice(0, limit).map((player) => player.id);
}

function compare_nullable_numbers(a: number | null, b: number | null): number {
  const a_value = a ?? Number.POSITIVE_INFINITY;
  const b_value = b ?? Number.POSITIVE_INFINITY;
  return a_value - b_value;
}

function compare_strings_case_insensitive(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function summarize_selected_team_players(
  team_players: TeamPlayer[],
  selected_player_ids: string[],
): TeamPlayer[] {
  const selected_set = new Set(selected_player_ids);

  return team_players
    .filter((player) => selected_set.has(player.id))
    .sort((a, b) => {
      const jersey_comparison = compare_nullable_numbers(
        a.jersey_number,
        b.jersey_number,
      );
      if (jersey_comparison !== 0) return jersey_comparison;

      const name_a = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim();
      const name_b = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim();
      return compare_strings_case_insensitive(name_a, name_b);
    });
}
