import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_dynamic_form_dependency_change_flags,
  reload_dynamic_form_dependent_field_options,
  update_team_exclusion_options,
} from "./dynamicEntityFormDependencyOptions";

const { fetch_filtered_mock, exclusion_mock } = vi.hoisted(() => ({
  fetch_filtered_mock: vi.fn(),
  exclusion_mock: vi.fn(() => [{ id: "team-2" }]),
}));

vi.mock("./dynamicFormDataLoader", () => ({
  compute_teams_after_exclusion: exclusion_mock,
  fetch_filtered_entities_for_field: fetch_filtered_mock,
}));

const EMPTY_STATE = {
  form_data: {},
  foreign_key_options: {},
  all_competition_teams_cache: [],
};

describe("dynamicEntityFormDependencyOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["PlayerTeamMembership", "team_id", false, true, false],
    ["playerteamtransferhistory", "to_team_id", false, true, false],
    ["PlayerTeamMembership", "status", false, false, false],
    ["Fixture", "away_team_id", false, false, true],
    ["Fixture", "home_jersey_id", true, false, false],
    ["Team", "home_team_id", false, false, false],
  ])(
    "builds change flags for %s/%s",
    (
      entity_type,
      field,
      should_check_jersey_color_clashes,
      should_run_gender_mismatch_check,
      should_run_fixture_team_gender_mismatch_check,
    ) => {
      expect(
        build_dynamic_form_dependency_change_flags(entity_type, field),
      ).toEqual({
        should_check_jersey_color_clashes,
        should_run_gender_mismatch_check,
        should_run_fixture_team_gender_mismatch_check,
      });
    },
  );

  it("clears dependents and auto-selects the membership team", async () => {
    fetch_filtered_mock.mockResolvedValue({
      entities: [{ id: "team-1" }],
      auto_select_team_id: "team-1",
    });
    const result = await reload_dynamic_form_dependent_field_options(
      {
        fields: [
          {
            field_name: "team_id",
            foreign_key_filter: { depends_on_field: "player_id" },
          },
          { field_name: "jersey_id", foreign_key_filter: {} },
        ],
      } as never,
      "player_id",
      "player-1",
      { ...EMPTY_STATE, form_data: { team_id: "old", jersey_id: "j" } },
    );
    expect(result.form_data).toEqual({ team_id: "team-1", jersey_id: "j" });
    expect(result.foreign_key_options).toEqual({ team_id: [{ id: "team-1" }] });
  });

  it("empties dependent options when the dependency value is blank", async () => {
    const result = await reload_dynamic_form_dependent_field_options(
      {
        fields: [
          {
            field_name: "stage_id",
            foreign_key_filter: { depends_on_field: "competition_id" },
          },
        ],
      } as never,
      "competition_id",
      "",
      EMPTY_STATE,
    );
    expect(result.foreign_key_options).toEqual({ stage_id: [] });
    expect(fetch_filtered_mock).not.toHaveBeenCalled();
  });

  it("only recomputes exclusions when competition teams are cached", () => {
    const metadata = {
      fields: [
        {
          field_name: "away_team_id",
          foreign_key_filter: {
            filter_type: "teams_from_competition",
            exclude_field: "home_team_id",
          },
        },
      ],
    } as never;
    expect(
      update_team_exclusion_options(metadata, {}, "home_team_id", [], {}),
    ).toEqual({});
    expect(
      update_team_exclusion_options(
        metadata,
        { home_team_id: 4 },
        "home_team_id",
        [{ id: "team-1" }] as never,
        {},
      ),
    ).toEqual({ away_team_id: [{ id: "team-2" }] });
    expect(exclusion_mock).toHaveBeenCalledWith([{ id: "team-1" }], "");
  });
});
