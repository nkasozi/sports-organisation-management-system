import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { handle_dynamic_form_dependency_change } from "./dynamicEntityFormDependencyHandling";

const {
  compute_teams_after_exclusion_mock,
  fetch_filtered_entities_for_field_mock,
  fetch_venue_name_for_team_mock,
} = vi.hoisted(() => ({
  compute_teams_after_exclusion_mock: vi.fn(),
  fetch_filtered_entities_for_field_mock: vi.fn(),
  fetch_venue_name_for_team_mock: vi.fn(),
}));

vi.mock("./dynamicFormDataLoader", () => ({
  compute_teams_after_exclusion: compute_teams_after_exclusion_mock,
  fetch_filtered_entities_for_field: fetch_filtered_entities_for_field_mock,
  fetch_venue_name_for_team: fetch_venue_name_for_team_mock,
}));

function create_entity<TExtra extends Record<string, unknown>>(
  id: string,
  extra: TExtra,
): BaseEntity & TExtra {
  return {
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...extra,
  } as BaseEntity & TExtra;
}

describe("dynamicEntityFormDependencyHandling", () => {
  beforeEach(() => {
    compute_teams_after_exclusion_mock.mockReset();
    fetch_filtered_entities_for_field_mock.mockReset();
    fetch_venue_name_for_team_mock.mockReset();
  });

  it("returns the unchanged state when entity metadata is unavailable", async () => {
    await expect(
      handle_dynamic_form_dependency_change({
        entity_type: "FixtureDetailsSetup",
        entity_metadata: void 0,

        changed_field_name: "home_team_jersey_id",
        new_value: "jersey-1",
        form_data: { home_team_jersey_id: "jersey-1" },
        foreign_key_options: {},
        all_competition_teams_cache: [],
      }),
    ).resolves.toEqual({
      entity_type: "FixtureDetailsSetup",

      changed_field_name: "home_team_jersey_id",
      new_value: "jersey-1",
      form_data: { home_team_jersey_id: "jersey-1" },
      foreign_key_options: {},
      all_competition_teams_cache: [],
      should_check_jersey_color_clashes: true,
      should_run_gender_mismatch_check: false,
      should_run_fixture_team_gender_mismatch_check: false,
    });
  });

  it("reloads dependent foreign-key options, applies exclusions, and hydrates the fixture venue", async () => {
    const player = create_entity("player-1", {});
    const away_team = create_entity("team-2", { name: "Falcons" });
    const home_team = create_entity("team-1", {});

    fetch_filtered_entities_for_field_mock.mockResolvedValueOnce({
      entities: [away_team],
      auto_select_team_id: "team-2",
      all_competition_teams: [home_team, away_team],
    });
    compute_teams_after_exclusion_mock.mockReturnValueOnce([away_team]);
    fetch_venue_name_for_team_mock.mockResolvedValueOnce("Main Stadium");

    await expect(
      handle_dynamic_form_dependency_change({
        entity_type: "Fixture",
        entity_metadata: {
          fields: [
            {
              field_name: "away_team_id",
              foreign_key_filter: {
                depends_on_field: "home_team_id",
                filter_type: "teams_from_competition",
                exclude_field: "home_team_id",
              },
            },
          ],
        } as never,
        changed_field_name: "home_team_id",
        new_value: "team-1",
        form_data: { home_team_id: "team-1" },
        foreign_key_options: { player_id: [player] },
        all_competition_teams_cache: [],
      }),
    ).resolves.toEqual({
      form_data: {
        home_team_id: "team-1",
        away_team_id: "team-2",
        venue: "Main Stadium",
      },
      foreign_key_options: {
        player_id: [player],
        away_team_id: [away_team],
      },
      all_competition_teams_cache: [home_team, away_team],
      should_check_jersey_color_clashes: false,
      should_run_gender_mismatch_check: false,
      should_run_fixture_team_gender_mismatch_check: true,
    });
  });
});
