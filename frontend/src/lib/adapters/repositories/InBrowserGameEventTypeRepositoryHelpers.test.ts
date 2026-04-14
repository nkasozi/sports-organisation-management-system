import { describe, expect, it } from "vitest";

import type { GameEventType } from "../../core/entities/GameEventType";
import type { ScalarInput } from "../../core/types/DomainScalars";
import {
  apply_game_event_type_filter,
  sort_game_event_types,
} from "./InBrowserGameEventTypeRepositoryHelpers";

function create_game_event_type(
  overrides: Partial<ScalarInput<GameEventType>> = {},
): GameEventType {
  return {
    id: "event_type_1",
    name: "Goal",
    code: "GOAL",
    sport_id: "sport_1",
    category: "scoring",
    affects_score: true,
    requires_player: true,
    status: "active",
    organization_id: "org_1",
    display_order: 1,
    ...overrides,
  } as GameEventType;
}

describe("InBrowserGameEventTypeRepositoryHelpers", () => {
  it("filters event types with case-insensitive names and sport fallbacks", () => {
    const global_event_type = create_game_event_type({
      id: "event_type_2",
      name: "Card",
      sport_id: null,
      category: "discipline",
      affects_score: false,
      requires_player: false,
    });

    expect(
      apply_game_event_type_filter(
        [create_game_event_type(), global_event_type],
        {
          name_contains: "ca",
          sport_id: "sport_1",
          category: "discipline",
          affects_score: false,
          requires_player: false,
          organization_id: "org_1",
        },
      ),
    ).toEqual([global_event_type]);
  });

  it("sorts event types by display order without mutating the input array", () => {
    const event_types = [
      create_game_event_type({ id: "event_type_1", display_order: 30 }),
      create_game_event_type({ id: "event_type_2", display_order: 10 }),
      create_game_event_type({ id: "event_type_3", display_order: 20 }),
    ];

    expect(
      sort_game_event_types(event_types).map(
        (event_type: GameEventType) => event_type.id,
      ),
    ).toEqual(["event_type_2", "event_type_3", "event_type_1"]);
    expect(
      event_types.map((event_type: GameEventType) => event_type.id),
    ).toEqual(["event_type_1", "event_type_2", "event_type_3"]);
  });
});
