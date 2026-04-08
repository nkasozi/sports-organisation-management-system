import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";

const {
  build_dynamic_form_jersey_color_warnings_mock,
  fetch_entities_for_type_mock,
  fetch_filtered_entities_for_field_mock,
  fetch_unfiltered_foreign_key_options_mock,
  load_dynamic_form_official_conflict_warnings_mock,
} = vi.hoisted(() => ({
  build_dynamic_form_jersey_color_warnings_mock: vi.fn(),
  fetch_entities_for_type_mock: vi.fn(),
  fetch_filtered_entities_for_field_mock: vi.fn(),
  fetch_unfiltered_foreign_key_options_mock: vi.fn(),
  load_dynamic_form_official_conflict_warnings_mock: vi.fn(),
}));

vi.mock("./dynamicEntityFormConflictWarnings", () => ({
  build_dynamic_form_jersey_color_warnings:
    build_dynamic_form_jersey_color_warnings_mock,
}));

vi.mock("./dynamicEntityFormOfficialConflictWarnings", () => ({
  load_dynamic_form_official_conflict_warnings:
    load_dynamic_form_official_conflict_warnings_mock,
}));

vi.mock("./dynamicFormDataLoader", () => ({
  fetch_entities_for_type: fetch_entities_for_type_mock,
  fetch_filtered_entities_for_field: fetch_filtered_entities_for_field_mock,
  fetch_unfiltered_foreign_key_options:
    fetch_unfiltered_foreign_key_options_mock,
}));

import {
  load_dynamic_form_initial_state,
  load_dynamic_form_initialized_filtered_options,
} from "./dynamicEntityFormInitialLoad";

function create_entity<TExtra extends Record<string, unknown>>(
  id: string,
  extra: TExtra,
): BaseEntity & TExtra {
  return {
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...extra,
  };
}

describe("dynamicEntityFormInitialLoad", () => {
  beforeEach(() => {
    build_dynamic_form_jersey_color_warnings_mock.mockReset();
    fetch_entities_for_type_mock.mockReset();
    fetch_filtered_entities_for_field_mock.mockReset();
    fetch_unfiltered_foreign_key_options_mock.mockReset();
    load_dynamic_form_official_conflict_warnings_mock.mockReset();
  });

  it("loads dependent filtered options and populates fixture competition options when needed", async () => {
    const fixture = create_entity("fixture-1", {});
    const team = create_entity("team-1", {});
    const player = create_entity("player-1", {});
    const competition = create_entity("competition-1", {});

    fetch_filtered_entities_for_field_mock.mockResolvedValueOnce({
      entities: [fixture],
      auto_select_team_id: "fixture-1",
      all_competition_teams: [team],
    });
    fetch_entities_for_type_mock.mockResolvedValueOnce([competition]);

    await expect(
      load_dynamic_form_initialized_filtered_options(
        {
          fields: [
            {
              field_name: "fixture_id",
              foreign_key_filter: { depends_on_field: "team_id" },
              foreign_key_entity: "fixture",
            },
          ],
        } as never,
        { team_id: "team-1" },
        {
          form_data: { team_id: "team-1" },
          foreign_key_options: { player_id: [player] },
          all_competition_teams_cache: [],
        },
      ),
    ).resolves.toEqual({
      form_data: { team_id: "team-1", fixture_id: "fixture-1" },
      foreign_key_options: {
        player_id: [player],
        fixture_id: [fixture],
        competition_id: [competition],
      },
      all_competition_teams_cache: [team],
    });
  });

  it("loads the initial state, jersey clash warnings, and official conflict warnings", async () => {
    const team = create_entity("team-1", {});

    fetch_unfiltered_foreign_key_options_mock.mockResolvedValueOnce({
      team_id: [team],
    });
    build_dynamic_form_jersey_color_warnings_mock.mockReturnValueOnce([
      "Jersey clash",
    ]);
    load_dynamic_form_official_conflict_warnings_mock.mockResolvedValueOnce([
      "Official conflict",
    ]);

    await expect(
      load_dynamic_form_initial_state(
        { fields: [] } as never,
        { team_id: "team-1" },
        "FixtureDetailsSetup",
        {} as never,
      ),
    ).resolves.toEqual({
      form_state: {
        form_data: { team_id: "team-1" },
        foreign_key_options: { team_id: [team] },
        all_competition_teams_cache: [],
      },
      warning_state: {
        color_clash_warnings: ["Jersey clash"],
        official_team_conflict_warnings: ["Official conflict"],
      },
    });
  });
});
