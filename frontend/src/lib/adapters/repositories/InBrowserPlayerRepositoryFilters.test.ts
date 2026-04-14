import { describe, expect, it } from "vitest";

import type { Player } from "../../core/entities/Player";
import type { ScalarInput } from "../../core/types/DomainScalars";
import {
  apply_player_entity_filter,
  filter_players_by_player_ids,
  get_membership_player_ids_by_jersey_number,
} from "./InBrowserPlayerRepositoryFilters";

function create_player(overrides: Partial<ScalarInput<Player>> = {}): Player {
  return {
    id: "player_1",
    first_name: "Grace",
    last_name: "Namutebi",
    organization_id: "org_1",
    position_id: "position_1",
    status: "active",
    nationality: "Ugandan",
    ...overrides,
  } as Player;
}

describe("InBrowserPlayerRepositoryFilters", () => {
  it("filters players by organization, name, position, status, and nationality", () => {
    const matching_player = create_player();
    const other_player = create_player({
      id: "player_2",
      first_name: "Amina",
      last_name: "Kato",
      nationality: "Kenyan",
      position_id: "position_2",
    });

    expect(
      apply_player_entity_filter([matching_player, other_player], {
        organization_id: "org_1",
        name_contains: "namu",
        position_id: "position_1",
        status: "active",
        nationality: "Ugandan",
      }),
    ).toEqual([matching_player]);
  });

  it("filters by player ids and extracts jersey-number memberships", () => {
    const players = [create_player(), create_player({ id: "player_2" })];

    expect(
      filter_players_by_player_ids(players, new Set(["player_2"])),
    ).toEqual([players[1]]);

    expect(
      Array.from(
        get_membership_player_ids_by_jersey_number(
          [
            { player_id: "player_1", jersey_number: 7 },
            { player_id: "player_1", jersey_number: 7 },
            { player_id: "player_2", jersey_number: 10 },
          ],
          7,
        ),
      ),
    ).toEqual(["player_1"]);
  });
});
