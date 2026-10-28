import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_empty_competition_input,
  derive_competition_status,
  get_competition_status_display,
  merge_sport_and_competition_rules,
  read_max_event_edits_per_game,
  validate_competition_input,
} from "./CompetitionHelpers";

describe("CompetitionHelpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T10:00:00.000Z"));
  });

  it("derives status labels from date ranges", () => {
    expect(
      derive_competition_status(
        "2026-04-10",
        "2026-04-20",
        new Date("2026-04-08T00:00:00.000Z"),
      ),
    ).toBe("upcoming");
    expect(
      derive_competition_status(
        "2026-04-01",
        "2026-04-20",
        new Date("2026-04-08T00:00:00.000Z"),
      ),
    ).toBe("active");
    expect(
      derive_competition_status(
        "2026-03-01",
        "2026-04-01",
        new Date("2026-04-08T00:00:00.000Z"),
      ),
    ).toBe("completed");
    expect(get_competition_status_display("active")).toEqual({
      label: "Active",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    });
  });

  it("creates default competition inputs and validates invalid ones", () => {
    expect(create_empty_competition_input("org_1")).toMatchObject({
      organization_id: "org_1",
      max_teams: 16,
      status: "active",
      registration_deadline: "2026-04-08",
      allow_auto_fixture_details_setup: true,
      max_event_edits_per_game: 3,
    });

    expect(
      validate_competition_input({
        name: "A",
        organization_id: "",
        competition_format_id: "",
        start_date: "2026-05-10",
        end_date: "2026-05-01",
        max_teams: 1,
      } as never),
    ).toEqual([
      "Competition name must be at least 2 characters",
      "Organization is required",
      "Competition format is required",
      "End date must be after start date",
      "Maximum teams must be at least 2",
    ]);
  });

  it("rejects event edit limits outside 0 to 20 whole numbers", () => {
    const valid_input = {
      ...create_empty_competition_input("org_1"),
      name: "League",
      competition_format_id: "format_1",
    };
    const out_of_range_message =
      "Event edits allowed per game must be a whole number from 0 to 20";
    expect(validate_competition_input(valid_input)).toEqual([]);
    expect(
      validate_competition_input({
        ...valid_input,
        max_event_edits_per_game: 0,
      }),
    ).toEqual([]);
    for (const invalid_value of [-1, 21, 2.5, Number.NaN]) {
      expect(
        validate_competition_input({
          ...valid_input,
          max_event_edits_per_game: invalid_value,
        }),
      ).toEqual([out_of_range_message]);
    }
  });

  it("reads the event edit limit and falls back to 3 for older records", () => {
    expect(read_max_event_edits_per_game({ max_event_edits_per_game: 5 })).toBe(
      5,
    );
    expect(read_max_event_edits_per_game({ max_event_edits_per_game: 0 })).toBe(
      0,
    );
    expect(read_max_event_edits_per_game({})).toBe(3);
    expect(
      read_max_event_edits_per_game({ max_event_edits_per_game: -2 }),
    ).toBe(3);
    expect(
      read_max_event_edits_per_game({
        max_event_edits_per_game: Number.POSITIVE_INFINITY,
      }),
    ).toBe(3);
  });

  it("merges sport defaults with competition overrides", () => {
    expect(
      merge_sport_and_competition_rules(
        {
          game_duration_minutes: 60,
          max_players_on_field: 11,
          custom_rules: { cards: "standard", substitutions: "rolling" },
        },
        {
          game_duration_minutes: 70,

          custom_rules: { substitutions: "limited" },
        },
      ),
    ).toEqual({
      game_duration_minutes: 70,

      max_players_on_field: 11,

      custom_rules: { cards: "standard", substitutions: "limited" },
    });
  });
});
