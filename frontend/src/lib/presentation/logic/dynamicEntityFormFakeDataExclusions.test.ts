import { describe, expect, it, vi } from "vitest";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import {
  type ActiveMembershipSource,
  load_fake_data_exclusions,
} from "./dynamicEntityFormFakeDataExclusions";
import { fill_required_foreign_keys } from "./dynamicEntityFormFakeDataForeignKeys";

const PLAYER_FIELD = {
  field_name: "player_id",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
} as FieldMetadata;

function membership_source(
  player_ids: string[],
  success = true,
): ActiveMembershipSource {
  return {
    list: vi.fn().mockResolvedValue(
      success
        ? {
            success: true,
            data: { items: player_ids.map((player_id) => ({ player_id })) },
          }
        : { success: false, error: "offline" },
    ),
  } as unknown as ActiveMembershipSource;
}

async function fill_player(excluded: ReadonlySet<string>): Promise<string> {
  const state = {
    form_data: { player_id: "" } as Record<string, unknown>,
    foreign_key_options: {
      player_id: [{ id: "p_busy" }, { id: "p_free" }] as never,
    },
  };
  await fill_required_foreign_keys({
    fields: [PLAYER_FIELD],
    get_form_state: () => state,
    locked_field_names: new Set(),
    change_foreign_key: async (field_name, value) => {
      state.form_data[field_name] = value;
    },
    excluded_option_ids: { player_id: excluded },
  });
  return String(state.form_data.player_id);
}

describe("fake memberships pick players who are free", () => {
  it("lists players already active on a team", async () => {
    const exclusions = await load_fake_data_exclusions(
      "PlayerTeamMembership",
      membership_source(["p_busy"]),
    );
    expect([...exclusions.player_id]).toEqual(["p_busy"]);
  });

  it("excludes nothing for other entities or when the lookup fails", async () => {
    expect(
      await load_fake_data_exclusions("team", membership_source(["p_busy"])),
    ).toEqual({});
    expect(
      await load_fake_data_exclusions(
        "playerteammembership",
        membership_source([], false),
      ),
    ).toEqual({});
  });

  it("never picks a busy player while a free one exists", async () => {
    for (let round = 0; round < 20; round += 1)
      expect(await fill_player(new Set(["p_busy"]))).toBe("p_free");
  });

  it("still fills the field when every player is busy", async () => {
    expect(["p_busy", "p_free"]).toContain(
      await fill_player(new Set(["p_busy", "p_free"])),
    );
  });
});
