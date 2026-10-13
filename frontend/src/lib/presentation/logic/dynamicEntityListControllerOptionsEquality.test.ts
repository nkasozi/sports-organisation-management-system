import { describe, expect, it, vi } from "vitest";

import { are_dynamic_entity_list_controller_options_equal } from "./dynamicEntityListControllerOptionsEquality";
import type { DynamicEntityListControllerOptions } from "./dynamicEntityListControllerTypes";

function create_options(
  overrides: Partial<DynamicEntityListControllerOptions>,
): DynamicEntityListControllerOptions {
  return {
    button_color_class: "primary",
    disabled_functionalities: [],
    enable_bulk_import: false,
    entity_type: "team",
    info_message: "",
    is_mobile_view: false,
    show_actions: true,
    ...overrides,
  };
}

describe("are_dynamic_entity_list_controller_options_equal", () => {
  it("treats the same option values as equal", () => {
    const on_selection_changed = vi.fn();

    expect(
      are_dynamic_entity_list_controller_options_equal(
        create_options({ on_selection_changed }),
        create_options({ on_selection_changed }),
      ),
    ).toBe(true);
  });

  it("treats freshly built arrays with the same items as equal", () => {
    expect(
      are_dynamic_entity_list_controller_options_equal(
        create_options({ disabled_functionalities: ["create", "delete"] }),
        create_options({ disabled_functionalities: ["create", "delete"] }),
      ),
    ).toBe(true);
  });

  it.each([
    [{ entity_type: "player" }],
    [{ disabled_functionalities: ["create" as const] }],
    [{ on_selection_changed: vi.fn() }],
    [{ sub_entity_filter: { foreign_key_field: "team_id" } as never }],
  ])("detects a changed option %o", (overrides) => {
    expect(
      are_dynamic_entity_list_controller_options_equal(
        create_options({}),
        create_options(overrides),
      ),
    ).toBe(false);
  });

  it("detects arrays that differ in length or order", () => {
    expect(
      are_dynamic_entity_list_controller_options_equal(
        create_options({ disabled_functionalities: ["create", "delete"] }),
        create_options({ disabled_functionalities: ["delete", "create"] }),
      ),
    ).toBe(false);
  });
});
