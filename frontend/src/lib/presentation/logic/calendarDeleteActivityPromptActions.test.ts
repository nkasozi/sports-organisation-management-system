import { describe, expect, it, vi } from "vitest";

import {
  CALENDAR_DELETE_ACTIVITY_PROMPT_STATUS as STATUS,
  type CalendarDeleteActivityPromptState,
  create_hidden_calendar_delete_activity_prompt_state,
} from "./calendarDeleteActivityPrompt";
import { create_calendar_delete_activity_prompt_actions } from "./calendarDeleteActivityPromptActions";

function create_actions_harness(delete_activity: () => Promise<boolean>): {
  actions: ReturnType<typeof create_calendar_delete_activity_prompt_actions>;
  read_state: () => CalendarDeleteActivityPromptState;
} {
  let current_state = create_hidden_calendar_delete_activity_prompt_state();
  return {
    actions: create_calendar_delete_activity_prompt_actions({
      get_prompt_state: () => current_state,
      set_prompt_state: (state: CalendarDeleteActivityPromptState) => {
        current_state = state;
      },
      delete_activity,
    }),
    read_state: () => current_state,
  };
}

describe("create_calendar_delete_activity_prompt_actions", () => {
  it("opens the prompt when a choice is requested", () => {
    const harness = create_actions_harness(async () => true);

    expect(harness.actions.request_choice()).toBe(true);
    expect(harness.read_state()).toEqual({ status: STATUS.AWAITING_CHOICE });
  });

  it("hides the prompt on cancel without deleting", () => {
    const delete_activity = vi.fn(async () => true);
    const harness = create_actions_harness(delete_activity);

    harness.actions.request_choice();

    expect(harness.actions.cancel()).toBe(true);
    expect(harness.read_state()).toEqual({ status: STATUS.HIDDEN });
    expect(delete_activity).not.toHaveBeenCalled();
  });

  it("reports a rejected request while the prompt is already open", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const harness = create_actions_harness(async () => true);

    harness.actions.request_choice();

    expect(harness.actions.request_choice()).toBe(false);
    expect(harness.read_state()).toEqual({ status: STATUS.AWAITING_CHOICE });
  });

  it("deletes the activity and hides the prompt on confirm", async () => {
    const delete_activity = vi.fn(async () => true);
    const harness = create_actions_harness(delete_activity);

    harness.actions.request_choice();

    expect(await harness.actions.confirm()).toBe(true);
    expect(delete_activity).toHaveBeenCalledTimes(1);
    expect(harness.read_state()).toEqual({ status: STATUS.HIDDEN });
  });
});
