import { describe, expect, it } from "vitest";

import {
  are_all_required_wizard_steps_completed,
  can_navigate_next_step,
  can_navigate_previous_step,
  get_current_wizard_step,
  get_wizard_progress_percentage,
  get_wizard_step_connector_class,
  get_wizard_step_status_class,
  is_final_wizard_step,
} from "./uiWizardStepper";

describe("uiWizardStepper", () => {
  it("returns the current step and computes progress safely", () => {
    expect(get_current_wizard_step([{ step_title: "Select Team" }], 0)).toEqual(
      { step_title: "Select Team" },
    );
    expect(get_current_wizard_step([], 0)).toBeNull();
    expect(get_wizard_progress_percentage(1, 4)).toBe(50);
    expect(get_wizard_progress_percentage(0, 0)).toBe(0);
  });

  it("enforces wizard navigation rules for required, optional, and custom-validated steps", () => {
    expect(can_navigate_previous_step(0)).toBe(false);
    expect(can_navigate_previous_step(2)).toBe(true);
    expect(
      can_navigate_next_step(
        0,
        [{ is_completed: false }, { is_completed: false }],
        false,
        false,
      ),
    ).toBe(false);
    expect(
      can_navigate_next_step(
        0,
        [{ is_completed: false, is_optional: true }, { is_completed: false }],
        true,
        false,
      ),
    ).toBe(true);
    expect(
      can_navigate_next_step(
        0,
        [{ is_completed: false }, { is_completed: false }],
        false,
        true,
      ),
    ).toBe(true);
    expect(is_final_wizard_step(1, 2)).toBe(true);
    expect(
      are_all_required_wizard_steps_completed([
        { is_completed: true },
        { is_optional: true },
        { is_completed: false },
      ]),
    ).toBe(false);
  });

  it("returns status and connector classes for current, completed, and pending steps", () => {
    expect(get_wizard_step_status_class({ is_completed: false }, 1, 1)).toBe(
      "bg-secondary-600 text-white dark:bg-secondary-500",
    );
    expect(get_wizard_step_status_class({ is_completed: true }, 1, 0)).toBe(
      "bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100",
    );
    expect(get_wizard_step_status_class({ is_completed: false }, 1, 2)).toBe(
      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    );
    expect(
      get_wizard_step_connector_class([{ is_completed: false }], 0, 0),
    ).toBe("bg-secondary-600 dark:bg-secondary-500");
    expect(
      get_wizard_step_connector_class(
        [{ is_completed: false }, { is_completed: false }],
        0,
        1,
      ),
    ).toBe("bg-gray-200 dark:bg-gray-600");
  });
});
