import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";

export type TeamPlayer = Player & {
  jersey_number: number | null;
  position: string | null;
};

export function build_position_name_by_id_map(
  positions: Array<{ id: string; name: string }>,
): Map<string, string> {
  return new Map(positions.map((position) => [position.id, position.name]));
}

export function pick_best_membership_for_player(
  memberships: PlayerTeamMembership[],
  player_id: string,
): PlayerTeamMembership | null {
  const candidates = memberships
    .filter((membership) => membership.player_id === player_id)
    .sort((left_membership, right_membership) =>
      left_membership.start_date < right_membership.start_date ? 1 : -1,
    );

  const active_membership = candidates.find(
    (membership) => membership.status === "active",
  );
  return active_membership || candidates[0] || null;
}

export function build_team_players(
  players: Player[],
  memberships: PlayerTeamMembership[],
  position_name_by_id: Map<string, string>,
): TeamPlayer[] {
  return players.map((player) => {
    const membership = pick_best_membership_for_player(memberships, player.id);
    const position = player.position_id
      ? position_name_by_id.get(player.position_id) || null
      : null;

    return {
      ...player,
      jersey_number: membership?.jersey_number ?? null,
      position,
    };
  });
}

export function is_submitted_lineup_status(
  status: FixtureLineup["status"],
): boolean {
  return status === "submitted" || status === "locked";
}

export function has_team_submitted_lineup(
  lineups: FixtureLineup[],
  team_id: string,
): boolean {
  return lineups.some(
    (lineup) =>
      lineup.team_id === team_id && is_submitted_lineup_status(lineup.status),
  );
}

export function format_team_player_option(player: TeamPlayer): string {
  const jersey_number = player.jersey_number ?? "?";
  const full_name = `${player.first_name} ${player.last_name}`;
  const position_suffix = player.position ? `• ${player.position}` : "";
  return `#${jersey_number} ${full_name} ${position_suffix}`.trim();
}

export function filter_team_players(
  players: TeamPlayer[],
  search_text: string,
): TeamPlayer[] {
  const search = search_text.toLowerCase().trim();
  if (!search) {
    return players;
  }

  return players.filter((player) => {
    const jersey_text = (player.jersey_number ?? "").toString();
    const full_name = `${player.first_name} ${player.last_name}`.toLowerCase();
    const position = (player.position ?? "").toLowerCase();
    return (
      jersey_text.includes(search) ||
      full_name.includes(search) ||
      position.includes(search)
    );
  });
}
