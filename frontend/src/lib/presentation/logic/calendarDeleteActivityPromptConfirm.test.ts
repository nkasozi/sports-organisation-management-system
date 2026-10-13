import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CALENDAR_DELETE_ACTIVITY_PROMPT_STATUS as STATUS,
  type CalendarDeleteActivityPromptState,
  confirm_calendar_delete_activity,
} from "./calendarDeleteActivityPrompt";

const hidden_state: CalendarDeleteActivityPromptState = {
  status: STATUS.HIDDEN,
};
const awaiting_state: CalendarDeleteActivityPromptState = {
  status: STATUS.AWAITING_CHOICE,
};
const deleting_state: CalendarDeleteActivityPromptState = {
  status: STATUS.DELETING,
};

function create_prompt_command(
  initial_state: CalendarDeleteActivityPromptState,
  delete_activity: () => Promise<boolean>,
): {
  get_prompt_state: () => CalendarDeleteActivityPromptState;
  set_prompt_state: (state: CalendarDeleteActivityPromptState) => void;
  delete_activity: () => Promise<boolean>;
  recorded_states: CalendarDeleteActivityPromptState[];
} {
  const recorded_states: CalendarDeleteActivityPromptState[] = [];
  let current_state = initial_state;
  return {
    get_prompt_state: () => current_state,
    set_prompt_state: (state: CalendarDeleteActivityPromptState) => {
      current_state = state;
      recorded_states.push(state);
    },
    delete_activity,
    recorded_states,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("confirm_calendar_delete_activity", () => {
  it("moves through deleting and hides the prompt when the delete succeeds", async () => {
    const command = create_prompt_command(awaiting_state, async () => true);

    expect(await confirm_calendar_delete_activity(command)).toBe(true);
    expect(command.recorded_states).toEqual([deleting_state, hidden_state]);
  });

  it("returns to awaiting choice when the delete fails", async () => {
    const command = create_prompt_command(awaiting_state, async () => false);

    expect(await confirm_calendar_delete_activity(command)).toBe(false);
    expect(command.recorded_states).toEqual([deleting_state, awaiting_state]);
  });

  it("deletes only once when confirmed twice while a delete is running", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    let finish_delete: (succeeded: boolean) => void = () => {};
    const delete_activity = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finish_delete = resolve;
        }),
    );
    const command = create_prompt_command(awaiting_state, delete_activity);

    const first_confirmation = confirm_calendar_delete_activity(command);
    const second_confirmation = await confirm_calendar_delete_activity(command);
    finish_delete(true);

    expect(second_confirmation).toBe(false);
    expect(await first_confirmation).toBe(true);
    expect(delete_activity).toHaveBeenCalledTimes(1);
  });

  it("does not delete when no choice is awaiting", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const delete_activity = vi.fn(async () => true);
    const command = create_prompt_command(hidden_state, delete_activity);

    expect(await confirm_calendar_delete_activity(command)).toBe(false);
    expect(delete_activity).not.toHaveBeenCalled();
    expect(command.recorded_states).toEqual([]);
  });
});
