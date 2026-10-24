import { describe, expect, it } from "vitest";

import {
  build_card_stat_categories,
  CARD_SORT_KIND,
  count_player_card_type,
  create_card_type_sort_mode,
  filter_and_sort_card_players,
  is_card_sort_mode_selected,
  resolve_card_type_for_event,
  TOTAL_CARD_SORT_MODE,
} from "./competitionResultsCardStats";
import type { PlayerStats } from "./competitionResultsStats";

const BASKETBALL_CARD_SOURCE = {
  card_types: [
    { id: "technical_foul", name: "Technical Foul" },
    { id: "flagrant_foul", name: "Flagrant Foul" },
  ],
  card_type_colors: [
    {
      id: "technical_foul",
      name: "Technical Foul",
      color: "#F59E0B",
      event_type: "technical_foul",
    },
  ],
  card_weights: new Map([
    ["technical_foul", 1],
    ["flagrant_foul", 3],
  ]),
};

const FOOTBALL_CARD_SOURCE = {
  card_types: [
    { id: "yellow_card", name: "Yellow Card" },
    { id: "red_card", name: "Red Card" },
  ],
  card_type_colors: [],
  card_weights: new Map([
    ["yellow_card", 1],
    ["red_card", 3],
  ]),
};

function create_player(
  player_name: string,
  card_counts: Record<string, number>,
): PlayerStats {
  return {
    player_name,
    team_name: "Falcons",
    points: 0,
    assists: 0,
    card_counts,
  };
}

describe("build_card_stat_categories", () => {
  it("labels categories with the sport's own card type names", () => {
    const categories = build_card_stat_categories(BASKETBALL_CARD_SOURCE);

    expect(categories.map((category) => category.label)).toEqual([
      "Technical Foul",
      "Flagrant Foul",
    ]);
    expect(categories[0]).toMatchObject({ color: "#F59E0B", weight: 1 });
    expect(categories[1].weight).toBe(3);
  });

  it("keeps a card type once when the competition repeats it", () => {
    const categories = build_card_stat_categories({
      ...FOOTBALL_CARD_SOURCE,
      card_types: [
        ...FOOTBALL_CARD_SOURCE.card_types,
        { id: "red_card", name: "Red Card" },
        { id: "blue_card", name: "Blue Card" },
      ],
    });

    expect(categories.map((category) => category.card_type_id)).toEqual([
      "yellow_card",
      "red_card",
      "blue_card",
    ]);
  });

  it("returns no categories for a sport without card types", () => {
    expect(
      build_card_stat_categories({
        card_types: [],
        card_type_colors: [],
        card_weights: new Map(),
      }),
    ).toEqual([]);
  });
});

describe("resolve_card_type_for_event", () => {
  const football = build_card_stat_categories(FOOTBALL_CARD_SOURCE);

  it("counts a second yellow as a red card in football", () => {
    expect(resolve_card_type_for_event(football, "second_yellow")).toEqual({
      status: "some",
      value: "red_card",
    });
  });

  it("ignores events that are not cards for the sport", () => {
    expect(resolve_card_type_for_event(football, "technical_foul")).toEqual({
      status: "none",
    });
  });
});

describe("filter_and_sort_card_players", () => {
  const categories = build_card_stat_categories(BASKETBALL_CARD_SOURCE);
  const players = [
    create_player("Alex", { technical_foul: 2 }),
    create_player("Sam", { flagrant_foul: 1 }),
    create_player("Jamie", {}),
  ];

  it("ranks by weighted total and drops players without cards", () => {
    expect(
      filter_and_sort_card_players(
        players,
        "all",
        TOTAL_CARD_SORT_MODE,
        categories,
      ).map((player) => player.player_name),
    ).toEqual(["Sam", "Alex"]);
  });

  it("shows only players with the chosen card type", () => {
    expect(
      filter_and_sort_card_players(
        players,
        "all",
        create_card_type_sort_mode("technical_foul"),
        categories,
      ).map((player) => player.player_name),
    ).toEqual(["Alex"]);
  });

  it("filters by team name", () => {
    expect(
      filter_and_sort_card_players(
        players,
        "Wolves",
        TOTAL_CARD_SORT_MODE,
        categories,
      ),
    ).toEqual([]);
  });
});

describe("card sort helpers", () => {
  it("tells which chip is selected", () => {
    const technical = create_card_type_sort_mode("technical_foul");

    expect(technical.kind).toBe(CARD_SORT_KIND.CARD_TYPE);
    expect(is_card_sort_mode_selected(technical, technical)).toBe(true);
    expect(is_card_sort_mode_selected(technical, TOTAL_CARD_SORT_MODE)).toBe(
      false,
    );
    expect(
      is_card_sort_mode_selected(
        technical,
        create_card_type_sort_mode("flagrant_foul"),
      ),
    ).toBe(false);
  });

  it("reads zero for a card type the player never received", () => {
    expect(
      count_player_card_type(create_player("Alex", {}), "technical_foul"),
    ).toBe(0);
  });
});
