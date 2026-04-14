import type { Player } from "../../core/entities/Player";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { PlayerFilter } from "../../core/interfaces/ports";

type PlayerMembershipLike = {
  jersey_number?: number | null;
  player_id: ScalarValueInput<Player["id"]>;
};

export function apply_player_entity_filter(
  entities: Player[],
  filter: PlayerFilter,
): Player[] {
  let filtered = entities;
  if (filter.organization_id) {
    filtered = filtered.filter(
      (player: Player) => player.organization_id === filter.organization_id,
    );
  }
  if (filter.id) {
    filtered = filtered.filter((player: Player) => player.id === filter.id);
  }
  if (filter.name_contains) {
    const term = filter.name_contains.toLowerCase();
    filtered = filtered.filter(
      (player: Player) =>
        player.first_name.toLowerCase().includes(term) ||
        player.last_name.toLowerCase().includes(term),
    );
  }
  if (filter.position_id) {
    filtered = filtered.filter(
      (player: Player) => player.position_id === filter.position_id,
    );
  }
  if (filter.status) {
    filtered = filtered.filter(
      (player: Player) => player.status === filter.status,
    );
  }
  if (filter.nationality) {
    filtered = filtered.filter(
      (player: Player) => player.nationality === filter.nationality,
    );
  }
  return filtered;
}

export function filter_players_by_player_ids(
  players: Player[],
  player_ids: Set<ScalarValueInput<Player["id"]>>,
): Player[] {
  return players.filter((player: Player) => player_ids.has(player.id));
}

export function get_membership_player_ids_by_jersey_number(
  memberships: PlayerMembershipLike[],
  jersey_number: number,
): Set<ScalarValueInput<Player["id"]>> {
  return new Set(
    memberships
      .filter(
        (membership: PlayerMembershipLike) =>
          membership.jersey_number === jersey_number,
      )
      .map((membership: PlayerMembershipLike) => membership.player_id),
  );
}
