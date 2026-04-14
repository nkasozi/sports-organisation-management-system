import { describe, expect, it } from "vitest";

import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { ScalarInput } from "../../core/types/DomainScalars";
import {
  apply_player_position_filter,
  sort_player_positions,
} from "./InBrowserPlayerPositionRepositoryHelpers";

function create_player_position(
  overrides: Partial<ScalarInput<PlayerPosition>> = {},
): PlayerPosition {
  return {
    id: "position_1",
    name: "Goalkeeper",
    code: "GK",
    category: "goalkeeper",
    description: "Goalkeeper",
    sport_type: "Field Hockey",
    display_order: 1,
    is_available: true,
    status: "active",
    organization_id: "org_1",
    ...overrides,
  } as PlayerPosition;
}

describe("InBrowserPlayerPositionRepositoryHelpers", () => {
  it("filters positions by availability, category, sport, and organization", () => {
    const target_position = create_player_position({
      id: "position_2",
      name: "Center Back",
      category: "defender",
    });

    expect(
      apply_player_position_filter(
        [create_player_position(), target_position],
        {
          name_contains: "center",
          category: "defender",
          sport_type: "Field Hockey",
          is_available: true,
          status: "active",
          organization_id: "org_1",
        },
      ),
    ).toEqual([target_position]);
  });

  it("sorts positions by display order", () => {
    const positions = [
      create_player_position({ id: "position_1", display_order: 30 }),
      create_player_position({ id: "position_2", display_order: 10 }),
      create_player_position({ id: "position_3", display_order: 20 }),
    ];

    expect(
      sort_player_positions(positions).map(
        (position: PlayerPosition) => position.id,
      ),
    ).toEqual(["position_2", "position_3", "position_1"]);
  });
});
