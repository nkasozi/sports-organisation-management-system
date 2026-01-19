import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";

export type TeamPlayer = Player & {
  jersey_number: number | null;
  position: string | null;
};

export function build_position_name_by_id(
  positions: PlayerPosition[],
): Map<string, string> {
  return new Map(
    positions
      .filter((position) => Boolean(position.id && position.name))
      .map((position) => [position.id, position.name]),
  );
}

export function pick_best_membership_for_player(
  memberships: PlayerTeamMembership[],
  player_id: string,
): PlayerTeamMembership | null {
  const candidates = memberships
    .filter((membership) => membership.player_id === player_id)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

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
    const position_name = player.position_id
      ? position_name_by_id.get(player.position_id) || null
      : null;

    return {
      ...player,
      jersey_number: membership?.jersey_number ?? null,
      position: position_name,
    };
  });
}

export function format_team_player_label(player: TeamPlayer): string {
  const jersey = player.jersey_number ?? "?";
  const name = `${player.first_name} ${player.last_name}`.trim();
  const position_suffix = player.position ? `• ${player.position}` : "";

  return `#${jersey} ${name} ${position_suffix}`.trim();
}

export function matches_team_player_search(
  player: TeamPlayer,
  search_text: string,
): boolean {
  const search = search_text.toLowerCase().trim();
  if (!search) return true;

  const jersey_text = (player.jersey_number ?? "").toString();
  const full_name = `${player.first_name} ${player.last_name}`
    .toLowerCase()
    .trim();
  const position = (player.position ?? "").toLowerCase().trim();

  return (
    jersey_text.includes(search) ||
    full_name.includes(search) ||
    position.includes(search)
  );
}
