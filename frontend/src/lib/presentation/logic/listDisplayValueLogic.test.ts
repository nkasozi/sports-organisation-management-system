import { describe, expect, it, vi } from "vitest";

import { get_display_value_for_entity_field } from "./listDisplayValueLogic";

vi.mock("./dynamicFormLogic", () => ({
  build_entity_display_label: vi.fn(
    (entity: { id: string }) => `Display ${entity.id}`,
  ),
}));

describe("listDisplayValueLogic", () => {
  it("returns empty strings for missing values and raw ids for id fields", () => {
    expect(get_display_value_for_entity_field({} as never, "name", {})).toBe(
      "",
    );
    expect(
      get_display_value_for_entity_field({ id: "team_1" } as never, "id", {}),
    ).toBe("team_1");
  });

  it("formats foreign keys, booleans, enum labels, and enum-style strings", () => {
    expect(
      get_display_value_for_entity_field(
        { team_id: "team_1" } as never,
        "team_id",
        { team_id: [{ id: "team_1" }] as never[] },
        { field_type: "foreign_key" } as never,
      ),
    ).toBe("Display team_1");

    expect(
      get_display_value_for_entity_field(
        { is_active: true } as never,
        "is_active",
        {},
      ),
    ).toBe("Yes");
    expect(
      get_display_value_for_entity_field(
        { status: "org_admin" } as never,
        "status",
        {},
        {
          enum_options: [
            { value: "org_admin", label: "Organization Administrator" },
          ],
        } as never,
      ),
    ).toBe("Organization Administrator");
    expect(
      get_display_value_for_entity_field(
        { role: "team_manager" } as never,
        "role",
        {},
      ),
    ).toBe("Team Manager");
  });
});
