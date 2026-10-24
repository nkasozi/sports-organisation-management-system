import { describe, expect, it } from "vitest";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import { fill_required_foreign_keys } from "./dynamicEntityFormFakeDataForeignKeys";

const REPEAT_COUNT = 30;

function foreign_key(field_name: string, exclude_field = ""): FieldMetadata {
  return {
    field_name,
    display_name: field_name,
    field_type: "foreign_key",
    is_required: true,
    is_read_only: false,
    ...(exclude_field
      ? {
          foreign_key_filter: {
            depends_on_field: "competition_id",
            filter_type: "teams_from_competition",
            exclude_field,
          },
        }
      : {}),
  } as FieldMetadata;
}

type PickState = {
  form_data: Record<string, unknown>;
  foreign_key_options: Record<string, Record<string, unknown>[]>;
};

async function run_fill(
  fields: FieldMetadata[],
  state: PickState,
): Promise<PickState> {
  await fill_required_foreign_keys({
    fields,
    get_form_state: () => state as never,
    locked_field_names: new Set(),
    change_foreign_key: async (field_name: string, value: string) => {
      state.form_data = { ...state.form_data, [field_name]: value };
    },
  });
  return state;
}

const FIXTURE_FIELDS = [
  foreign_key("home_team_id", "away_team_id"),
  foreign_key("away_team_id", "home_team_id"),
];

describe("fake data dropdown picks", () => {
  it("never picks the same team for home and away", async () => {
    for (let round = 0; round < REPEAT_COUNT; round += 1) {
      const teams = [{ id: "team_a" }, { id: "team_b" }];
      const state = await run_fill(FIXTURE_FIELDS, {
        form_data: {},
        foreign_key_options: { home_team_id: teams, away_team_id: teams },
      });
      expect(state.form_data.home_team_id).not.toBe(
        state.form_data.away_team_id,
      );
      expect(state.form_data.away_team_id).toBeTruthy();
    }
  });

  it("leaves the away team empty when the only team is already home", async () => {
    const teams = [{ id: "team_a" }];
    const state = await run_fill(FIXTURE_FIELDS, {
      form_data: {},
      foreign_key_options: { home_team_id: teams, away_team_id: teams },
    });
    expect(state.form_data.home_team_id).toBe("team_a");
    expect(state.form_data.away_team_id ?? "").toBe("");
  });

  it("puts a player on a team of the same gender when genders are known", async () => {
    for (let round = 0; round < REPEAT_COUNT; round += 1) {
      const state = await run_fill(
        [foreign_key("player_id"), foreign_key("team_id")],
        {
          form_data: {},
          foreign_key_options: {
            player_id: [{ id: "player_1", gender_id: "female" }],
            team_id: [
              { id: "men", gender_id: "male" },
              { id: "women", gender_id: "female" },
            ],
          },
        },
      );
      expect(state.form_data.team_id).toBe("women");
    }
  });

  it("still picks a team when none matches the player's gender", async () => {
    const state = await run_fill(
      [foreign_key("player_id"), foreign_key("team_id")],
      {
        form_data: {},
        foreign_key_options: {
          player_id: [{ id: "player_1", gender_id: "female" }],
          team_id: [{ id: "men", gender_id: "male" }],
        },
      },
    );
    expect(state.form_data.team_id).toBe("men");
  });
});
