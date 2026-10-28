import { describe, expect, it } from "vitest";

import {
  is_valid_max_event_edits_per_game,
  normalize_max_event_edits_per_game_input,
  read_max_event_edits_per_game,
} from "./CompetitionEventEditLimit";

describe("CompetitionEventEditLimit", () => {
  it("accepts only whole numbers from 0 to 20", () => {
    expect(is_valid_max_event_edits_per_game(0)).toBe(true);
    expect(is_valid_max_event_edits_per_game(20)).toBe(true);
    expect(is_valid_max_event_edits_per_game(-1)).toBe(false);
    expect(is_valid_max_event_edits_per_game(21)).toBe(false);
    expect(is_valid_max_event_edits_per_game(1.5)).toBe(false);
  });

  it("reads stored limits and treats missing or broken values as 3", () => {
    expect(read_max_event_edits_per_game({ max_event_edits_per_game: 7 })).toBe(
      7,
    );
    expect(read_max_event_edits_per_game({})).toBe(3);
    expect(
      read_max_event_edits_per_game({ max_event_edits_per_game: Number.NaN }),
    ).toBe(3);
  });

  it("coerces form input to a whole number in range, defaulting blanks to 3", () => {
    expect(normalize_max_event_edits_per_game_input(4)).toBe(4);
    expect(normalize_max_event_edits_per_game_input(0)).toBe(0);
    expect(normalize_max_event_edits_per_game_input("6")).toBe(6);
    expect(normalize_max_event_edits_per_game_input(2.6)).toBe(3);
    expect(normalize_max_event_edits_per_game_input("")).toBe(3);
    expect(normalize_max_event_edits_per_game_input(Number.NaN)).toBe(3);
    expect(normalize_max_event_edits_per_game_input({})).toBe(3);
    expect(normalize_max_event_edits_per_game_input(-4)).toBe(0);
    expect(normalize_max_event_edits_per_game_input(99)).toBe(20);
  });
});
