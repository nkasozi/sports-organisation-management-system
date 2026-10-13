import { afterEach, describe, expect, it, vi } from "vitest";

import {
  advance_calendar_delete_activity_prompt_state,
  CALENDAR_DELETE_ACTIVITY_PROMPT_EVENT as EVENT,
  CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND as KEY_COMMAND,
  CALENDAR_DELETE_ACTIVITY_PROMPT_STATUS as STATUS,
  type CalendarDeleteActivityPromptEvent,
  type CalendarDeleteActivityPromptState,
  create_hidden_calendar_delete_activity_prompt_state,
  is_calendar_delete_activity_prompt_busy,
  is_calendar_delete_activity_prompt_visible,
  resolve_calendar_delete_activity_prompt_key_command,
  transition_calendar_delete_activity_prompt_state,
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("transition_calendar_delete_activity_prompt_state", () => {
  it("starts hidden", () => {
    expect(create_hidden_calendar_delete_activity_prompt_state()).toEqual(
      hidden_state,
    );
  });

  it.each([
    [hidden_state, EVENT.CHOICE_REQUESTED, awaiting_state],
    [awaiting_state, EVENT.CANCELLED, hidden_state],
    [awaiting_state, EVENT.DELETE_CONFIRMED, deleting_state],
    [deleting_state, EVENT.DELETE_SUCCEEDED, hidden_state],
    [deleting_state, EVENT.DELETE_FAILED, awaiting_state],
  ])(
    "moves from %o on %s to %o",
    (
      current_state: CalendarDeleteActivityPromptState,
      event_type: CalendarDeleteActivityPromptEvent["type"],
      expected_state: CalendarDeleteActivityPromptState,
    ) => {
      expect(
        transition_calendar_delete_activity_prompt_state(current_state, {
          type: event_type,
        }),
      ).toEqual({ success: true, data: expected_state });
    },
  );

  it.each([
    [awaiting_state, EVENT.CHOICE_REQUESTED],
    [deleting_state, EVENT.CHOICE_REQUESTED],
    [deleting_state, EVENT.CANCELLED],
    [deleting_state, EVENT.DELETE_CONFIRMED],
    [hidden_state, EVENT.CANCELLED],
    [hidden_state, EVENT.DELETE_CONFIRMED],
    [hidden_state, EVENT.DELETE_SUCCEEDED],
    [awaiting_state, EVENT.DELETE_FAILED],
  ])(
    "rejects %o on %s",
    (
      current_state: CalendarDeleteActivityPromptState,
      event_type: CalendarDeleteActivityPromptEvent["type"],
    ) => {
      expect(
        transition_calendar_delete_activity_prompt_state(current_state, {
          type: event_type,
        }).success,
      ).toBe(false);
    },
  );
});

describe("advance_calendar_delete_activity_prompt_state", () => {
  it("returns the next state for an allowed transition", () => {
    expect(
      advance_calendar_delete_activity_prompt_state(hidden_state, {
        type: EVENT.CHOICE_REQUESTED,
      }),
    ).toEqual(awaiting_state);
  });

  it("keeps the current state and logs a structured warning when rejected", () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      advance_calendar_delete_activity_prompt_state(deleting_state, {
        type: EVENT.CANCELLED,
      }),
    ).toBe(deleting_state);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "calendar_delete_activity_prompt_transition_rejected",
        current_status: STATUS.DELETING,
        prompt_event: EVENT.CANCELLED,
      }),
    );
  });
});

describe("calendar delete activity prompt queries", () => {
  it.each([
    [hidden_state, false, false],
    [awaiting_state, true, false],
    [deleting_state, true, true],
  ])(
    "reports visibility and busy flags for %o",
    (
      state: CalendarDeleteActivityPromptState,
      expected_visible: boolean,
      expected_busy: boolean,
    ) => {
      expect(is_calendar_delete_activity_prompt_visible(state)).toBe(
        expected_visible,
      );
      expect(is_calendar_delete_activity_prompt_busy(state)).toBe(
        expected_busy,
      );
    },
  );
});

describe("resolve_calendar_delete_activity_prompt_key_command", () => {
  it.each([
    ["Escape", KEY_COMMAND.CANCEL],
    ["Tab", KEY_COMMAND.TRAP_FOCUS],
    ["Enter", KEY_COMMAND.NONE],
  ])("maps %s to %s", (key, expected_command) => {
    expect(resolve_calendar_delete_activity_prompt_key_command(key)).toBe(
      expected_command,
    );
  });
});
