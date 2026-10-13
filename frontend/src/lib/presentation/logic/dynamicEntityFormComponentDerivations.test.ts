import { describe, expect, it, vi } from "vitest";

import {
  get_authorization_preselect_values,
  get_authorization_restricted_fields,
} from "$lib/core/interfaces/ports";

import {
  build_dynamic_entity_form_auth_derivations,
  build_dynamic_entity_form_initialization_key,
  build_dynamic_entity_form_role_state,
  build_dynamic_entity_form_sorted_fields,
} from "./dynamicEntityFormComponentDerivations";

const { sorted_fields_mock, initialization_key_mock } = vi.hoisted(() => ({
  sorted_fields_mock: vi.fn(() => [{ field_name: "sorted" }]),
  initialization_key_mock: vi.fn(() => "key-1"),
}));

vi.mock("./dynamicEntityFormFieldState", () => ({
  get_dynamic_form_sorted_fields_for_display: sorted_fields_mock,
}));

vi.mock("./dynamicEntityFormInitialization", () => ({
  create_dynamic_form_initialization_key: initialization_key_mock,
}));

const METADATA = { entity_name: "team", fields: [{ field_name: "name" }] };

describe("dynamicEntityFormComponentDerivations", () => {
  it("derives the role state from the current profile", () => {
    expect(
      build_dynamic_entity_form_role_state({
        status: "present",
        profile: { role: "super_admin" },
      } as never),
    ).toEqual({ status: "present", role: "super_admin" });
    expect(
      build_dynamic_entity_form_role_state({ status: "missing" } as never),
    ).toEqual({ status: "missing" });
  });

  it("sorts fields only when metadata is present", () => {
    const filter = { foreign_key_field: "team_id", foreign_key_value: "t1" };
    expect(
      build_dynamic_entity_form_sorted_fields(
        METADATA as never,
        true,
        { name: "x" },
        filter,
      ),
    ).toEqual([{ field_name: "sorted" }]);
    expect(sorted_fields_mock).toHaveBeenCalledWith(
      METADATA.fields,
      true,
      { name: "x" },
      filter,
    );
    expect(
      build_dynamic_entity_form_sorted_fields(void 0, false, {}, void 0),
    ).toEqual([]);
  });

  it("builds the initialization key only when metadata is present", () => {
    expect(
      build_dynamic_entity_form_initialization_key(
        "Team",
        METADATA as never,
        { id: "team-1" } as never,
        { organization_id: "org-1" },
      ),
    ).toBe("key-1");
    expect(initialization_key_mock).toHaveBeenCalledWith({
      entity_type: "Team",
      metadata: METADATA,
      existing_data: { id: "team-1" },
      authorization_preselect: { organization_id: "org-1" },
    });
    expect(
      build_dynamic_entity_form_initialization_key("Team", void 0, void 0, {}),
    ).toBe("");
  });

  it("derives scope restrictions and preselected values from a scoped profile", () => {
    const derivations = build_dynamic_entity_form_auth_derivations({
      status: "present",
      profile: {
        role: "org_admin",
        organization_id: "org-1",
        team_id: "*",
        player_id: "*",
      },
    } as never);

    expect(derivations.role_state).toEqual({
      status: "present",
      role: "org_admin",
    });
    expect(derivations.restricted_fields.has("organization_id")).toBe(true);
    expect(derivations.preselect_values.organization_id).toBe("org-1");
  });

  it("derives missing-profile auth values when signed out", () => {
    const derivations = build_dynamic_entity_form_auth_derivations({
      status: "missing",
    } as never);

    expect(derivations).toEqual({
      role_state: { status: "missing" },
      restricted_fields: get_authorization_restricted_fields({
        status: "missing",
      }),
      preselect_values: get_authorization_preselect_values({
        status: "missing",
      }),
    });
  });
});
