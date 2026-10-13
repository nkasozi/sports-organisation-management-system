import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";

import { MEMBERSHIP_STATUS } from "../entities/StatusConstants";

export type TeamPlayer = Player & {
  jersey_number: number;
  position: string;
};

const MEMBERSHIP_SELECTION_STATUS = {
  MISSING: "missing",
  FOUND: "found",
} as const;

type MembershipSelectionResult =
  | { status: typeof MEMBERSHIP_SELECTION_STATUS.MISSING }
  | {
      status: typeof MEMBERSHIP_SELECTION_STATUS.FOUND;
      membership: PlayerTeamMembership;
    };

const UNKNOWN_JERSEY_NUMBER = 0;

function read_selected_jersey_number(
  membership_result: MembershipSelectionResult,
): number {
  switch (membership_result.status) {
    case MEMBERSHIP_SELECTION_STATUS.FOUND:
      return membership_result.membership.jersey_number;
    case MEMBERSHIP_SELECTION_STATUS.MISSING:
      return UNKNOWN_JERSEY_NUMBER;
  }
}

export function build_position_name_by_id(
  positions: PlayerPosition[],
): Map<PlayerPosition["id"], PlayerPosition["name"]> {
  return new Map(
    positions
      .filter((position) => Boolean(position.id && position.name))
      .map((position) => [position.id, position.name]),
  );
}

export function pick_best_membership_for_player(
  memberships: PlayerTeamMembership[],
  player_id: ScalarValueInput<Player["id"]>,
): MembershipSelectionResult {
  const candidates = memberships
    .filter((membership) => membership.player_id === player_id)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

  const active_membership = candidates.find(
    (membership) => membership.status === MEMBERSHIP_STATUS.ACTIVE,
  );

  const best_membership = active_membership || candidates[0];

  if (!best_membership) {
    return { status: MEMBERSHIP_SELECTION_STATUS.MISSING };
  }

  return {
    status: MEMBERSHIP_SELECTION_STATUS.FOUND,
    membership: best_membership,
  };
}

export function build_team_players(
  players: Player[],
  memberships: PlayerTeamMembership[],
  position_name_by_id: Map<PlayerPosition["id"], PlayerPosition["name"]>,
): TeamPlayer[] {
  return players.map((player) => {
    const membership_result = pick_best_membership_for_player(
      memberships,
      player.id,
    );
    const position_name = player.position_id
      ? position_name_by_id.get(player.position_id) || ""
      : "";

    return {
      ...player,
      jersey_number: read_selected_jersey_number(membership_result),
      position: position_name,
    };
  });
}

export function format_team_player_label(player: TeamPlayer): string {
  const jersey = player.jersey_number > 0 ? player.jersey_number : "?";
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

  const jersey_text =
    player.jersey_number > 0 ? player.jersey_number.toString() : "";
  const full_name = `${player.first_name} ${player.last_name}`
    .toLowerCase()
    .trim();
  const position = player.position.toLowerCase().trim();

  return (
    jersey_text.includes(search) ||
    full_name.includes(search) ||
    position.includes(search)
  );
}
