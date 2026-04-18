import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_dynamic_form_fake_data_state,
  navigate_to_dynamic_form_foreign_entity,
} from "./dynamicEntityFormLocalActions";

const {
  build_foreign_entity_route_mock,
  generate_fake_data_for_entity_fields_mock,
  goto_mock,
} = vi.hoisted(() => ({
  build_foreign_entity_route_mock: vi.fn(),
  generate_fake_data_for_entity_fields_mock: vi.fn(),
  goto_mock: vi.fn(),
}));

vi.mock("$app/navigation", () => ({
  goto: goto_mock,
}));

vi.mock("../../infrastructure/utils/FakeDataGenerator", () => ({
  fakeDataGenerator: {
    generate_fake_data_for_entity_fields:
      generate_fake_data_for_entity_fields_mock,
  },
}));

vi.mock("./dynamicFormLogic", () => ({
  build_foreign_entity_route: build_foreign_entity_route_mock,
}));

describe("dynamicEntityFormLocalActions", () => {
  beforeEach(() => {
    build_foreign_entity_route_mock.mockReset();
    generate_fake_data_for_entity_fields_mock.mockReset();
    goto_mock.mockReset();
  });

  it("keeps the current form state when fake data cannot be generated or the form is in edit mode", () => {
    const form_state = {
      form_data: { name: "Existing" },
      validation_errors: { name: "required" },
    };
    generate_fake_data_for_entity_fields_mock.mockReturnValueOnce({
      success: false,
    });

    expect(
      build_dynamic_form_fake_data_state(
        {} as never,
        false,
        form_state as never,
      ),
    ).toEqual(form_state);
    expect(
      build_dynamic_form_fake_data_state(
        { fields: [] } as never,
        true,
        form_state as never,
      ),
    ).toEqual(form_state);
    expect(
      build_dynamic_form_fake_data_state(
        { fields: [] } as never,
        false,
        form_state as never,
      ),
    ).toEqual(form_state);
  });

  it("merges generated fake data into a create-form state and clears validation errors", () => {
    generate_fake_data_for_entity_fields_mock.mockReturnValueOnce({
      success: true,
      generated_data: { name: "Generated", city: "Kampala" },
    });

    expect(
      build_dynamic_form_fake_data_state(
        { fields: [{ field_name: "name" }] } as never,
        false,
        {
          form_data: { code: "ABC" },
          validation_errors: { code: "invalid" },
        } as never,
      ),
    ).toEqual({
      form_data: { code: "ABC", name: "Generated", city: "Kampala" },
      validation_errors: {},
    });
  });

  it("navigates to a foreign entity route only when a route can be resolved", () => {
    build_foreign_entity_route_mock
      .mockImplementationOnce(() => {})
      .mockReturnValueOnce("/teams");

    expect(navigate_to_dynamic_form_foreign_entity()).toBe(false);
    expect(navigate_to_dynamic_form_foreign_entity("team")).toBe(true);
    expect(goto_mock).toHaveBeenCalledWith("/teams");
  });
});
