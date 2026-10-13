import { describe, expect, it } from "vitest";

import {
  build_dynamic_entity_form_display_flags,
  build_dynamic_entity_form_title,
} from "./dynamicEntityFormDisplayFlags";

const CREATE_FLAGS_INPUT = {
  entity_type: "Team",
  is_edit_mode: false,
  show_fake_data_button: true,
  is_signed_in: false,
  is_fake_data_generation_enabled: true,
};

describe("build_dynamic_entity_form_display_flags", () => {
  it("shows the fake data button only for signed-out creation with generation enabled", () => {
    expect(
      build_dynamic_entity_form_display_flags(CREATE_FLAGS_INPUT)
        .can_show_fake_data_button,
    ).toBe(true);
  });

  it.each([
    { show_fake_data_button: false },
    { is_edit_mode: true },
    { is_signed_in: true },
    { is_fake_data_generation_enabled: false },
  ])("hides the fake data button when %o", (override) => {
    expect(
      build_dynamic_entity_form_display_flags({
        ...CREATE_FLAGS_INPUT,
        ...override,
      }).can_show_fake_data_button,
    ).toBe(false);
  });

  it("shows the transfer notice only when creating a transfer history entry", () => {
    const transfer_input = {
      ...CREATE_FLAGS_INPUT,
      entity_type: "PlayerTeamTransferHistory",
    };
    expect(
      build_dynamic_entity_form_display_flags(transfer_input)
        .show_transfer_notice,
    ).toBe(true);
    expect(
      build_dynamic_entity_form_display_flags({
        ...transfer_input,
        is_edit_mode: true,
      }).show_transfer_notice,
    ).toBe(false);
    expect(
      build_dynamic_entity_form_display_flags(CREATE_FLAGS_INPUT)
        .show_transfer_notice,
    ).toBe(false);
  });
});

describe("build_dynamic_entity_form_title", () => {
  it("prefers the metadata display name", () => {
    expect(
      build_dynamic_entity_form_title(
        "team",
        { display_name: "Squad" } as never,
        true,
      ),
    ).toBe("Edit Squad");
  });

  it("falls back to a formatted entity type when metadata is missing", () => {
    expect(build_dynamic_entity_form_title("team", void 0, false)).toMatch(
      /^Create /,
    );
  });
});
