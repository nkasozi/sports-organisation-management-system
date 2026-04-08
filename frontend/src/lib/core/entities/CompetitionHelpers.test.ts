import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_empty_competition_input,
  derive_competition_status,
  get_competition_status_display,
  merge_sport_and_competition_rules,
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
          periods: undefined,
          additional_card_types: undefined,
          additional_foul_categories: undefined,
          official_requirements: undefined,
          overtime_rules: undefined,
          scoring_rules: undefined,
          substitution_rules: undefined,
          max_players_on_field: undefined,
          min_players_on_field: undefined,
          max_squad_size: undefined,
          custom_rules: { substitutions: "limited" },
        },
      ),
    ).toEqual({
      game_duration_minutes: 70,
      periods: undefined,
      additional_card_types: undefined,
      additional_foul_categories: undefined,
      official_requirements: undefined,
      overtime_rules: undefined,
      scoring_rules: undefined,
      substitution_rules: undefined,
      max_players_on_field: 11,
      min_players_on_field: undefined,
      max_squad_size: undefined,
      custom_rules: { cards: "standard", substitutions: "limited" },
    });
  });
});
