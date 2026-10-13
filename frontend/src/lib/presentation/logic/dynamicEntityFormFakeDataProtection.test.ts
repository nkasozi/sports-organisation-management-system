import { beforeEach, describe, expect, it, vi } from "vitest";

import { build_dynamic_form_fake_data_state } from "./dynamicEntityFormLocalActions";

const { generate_fake_data_for_entity_fields_mock } = vi.hoisted(() => ({
  generate_fake_data_for_entity_fields_mock: vi.fn(),
}));

vi.mock("$app/navigation", () => ({ goto: vi.fn() }));

vi.mock("../../infrastructure/utils/FakeDataGenerator", () => ({
  fakeDataGenerator: {
    generate_fake_data_for_entity_fields:
      generate_fake_data_for_entity_fields_mock,
  },
}));

const LOCKED_ORGANIZATION_ID = "org_default_1";

describe("fake data never overwrites authorization-locked fields", () => {
  beforeEach(() => {
    generate_fake_data_for_entity_fields_mock.mockReset();
    generate_fake_data_for_entity_fields_mock.mockReturnValue({
      success: true,
      generated_data: { name: "Head Coach", organization_id: "" },
    });
  });

  it("keeps the locked organization while filling the other fields", () => {
    const form_state = {
      form_data: { name: "", organization_id: LOCKED_ORGANIZATION_ID },
      validation_errors: {},
    };

    const next_state = build_dynamic_form_fake_data_state(
      { fields: [] } as never,
      false,
      form_state as never,
      new Set(["organization_id"]),
    );

    expect(next_state.form_data).toEqual({
      name: "Head Coach",
      organization_id: LOCKED_ORGANIZATION_ID,
    });
  });

  it("fills every field when nothing is locked", () => {
    const form_state = { form_data: {}, validation_errors: {} };

    const next_state = build_dynamic_form_fake_data_state(
      { fields: [] } as never,
      false,
      form_state as never,
      new Set(),
    );

    expect(next_state.form_data).toEqual({
      name: "Head Coach",
      organization_id: "",
    });
  });
});
