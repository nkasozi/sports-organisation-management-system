import { describe, expect, it } from "vitest";

import {
  build_login_local_change_prompt_message,
  create_hidden_login_local_change_prompt_state,
  is_discard_login_local_change_choice,
  LOGIN_LOCAL_CHANGE_PROMPT_CHOICE,
  LOGIN_LOCAL_CHANGE_PROMPT_EVENT,
  LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND,
  LOGIN_LOCAL_CHANGE_PROMPT_STATUS,
  type LoginLocalChangePromptState,
  resolve_login_local_change_prompt_key_command,
  transition_login_local_change_prompt_state,
} from "./layoutLoginLocalChangePrompt";

const awaiting_state: LoginLocalChangePromptState = {
  status: LOGIN_LOCAL_CHANGE_PROMPT_STATUS.AWAITING_CHOICE,
  unsynced_count: 3,
};

const resolved_state: LoginLocalChangePromptState = {
  status: LOGIN_LOCAL_CHANGE_PROMPT_STATUS.RESOLVED,
  unsynced_count: 3,
  choice: LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.KEEP_AND_SIGN_OUT,
};

describe("transition_login_local_change_prompt_state", () => {
  it("starts hidden", () => {
    expect(create_hidden_login_local_change_prompt_state()).toEqual({
      status: "hidden",
    });
  });

  it.each([create_hidden_login_local_change_prompt_state(), resolved_state])(
    "moves from %o to awaiting_choice when a choice is requested",
    (current_state: LoginLocalChangePromptState) => {
      expect(
        transition_login_local_change_prompt_state(current_state, {
          type: LOGIN_LOCAL_CHANGE_PROMPT_EVENT.CHOICE_REQUESTED,
          unsynced_count: 2,
        }),
      ).toEqual({
        success: true,
        data: { status: "awaiting_choice", unsynced_count: 2 },
      });
    },
  );

  it("rejects a choice request with no unsynced changes", () => {
    const result = transition_login_local_change_prompt_state(
      create_hidden_login_local_change_prompt_state(),
      {
        type: LOGIN_LOCAL_CHANGE_PROMPT_EVENT.CHOICE_REQUESTED,
        unsynced_count: 0,
      },
    );

    expect(result.success).toBe(false);
  });

  it("rejects a second choice request while one is awaiting", () => {
    const result = transition_login_local_change_prompt_state(awaiting_state, {
      type: LOGIN_LOCAL_CHANGE_PROMPT_EVENT.CHOICE_REQUESTED,
      unsynced_count: 5,
    });

    expect(result.success).toBe(false);
  });

  it("resolves an awaiting prompt with the chosen option", () => {
    expect(
      transition_login_local_change_prompt_state(awaiting_state, {
        type: LOGIN_LOCAL_CHANGE_PROMPT_EVENT.CHOICE_MADE,
        choice: LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.DISCARD_AND_CONTINUE,
      }),
    ).toEqual({
      success: true,
      data: {
        status: "resolved",
        unsynced_count: 3,
        choice: "discard_and_continue",
      },
    });
  });

  it.each([create_hidden_login_local_change_prompt_state(), resolved_state])(
    "rejects a choice when nothing is awaiting (%o)",
    (current_state: LoginLocalChangePromptState) => {
      const result = transition_login_local_change_prompt_state(current_state, {
        type: LOGIN_LOCAL_CHANGE_PROMPT_EVENT.CHOICE_MADE,
        choice: LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.DISCARD_AND_CONTINUE,
      });

      expect(result.success).toBe(false);
    },
  );
});

describe("is_discard_login_local_change_choice", () => {
  it("only treats discard_and_continue as permission to wipe local data", () => {
    expect(
      is_discard_login_local_change_choice(
        LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.DISCARD_AND_CONTINUE,
      ),
    ).toBe(true);
    expect(
      is_discard_login_local_change_choice(
        LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.KEEP_AND_SIGN_OUT,
      ),
    ).toBe(false);
  });
});

describe("build_login_local_change_prompt_message", () => {
  it("uses the singular form for one change", () => {
    expect(build_login_local_change_prompt_message(1)).toContain(
      "1 local change that has not been synced",
    );
  });

  it("uses the plural form for several changes", () => {
    expect(build_login_local_change_prompt_message(4)).toContain(
      "4 local changes that have not been synced",
    );
  });
});

describe("resolve_login_local_change_prompt_key_command", () => {
  it("maps Escape to keeping local changes", () => {
    expect(resolve_login_local_change_prompt_key_command("Escape")).toBe(
      LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND.KEEP_LOCAL_CHANGES,
    );
  });

  it("maps Tab to focus trapping", () => {
    expect(resolve_login_local_change_prompt_key_command("Tab")).toBe(
      LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND.TRAP_FOCUS,
    );
  });

  it("ignores other keys", () => {
    expect(resolve_login_local_change_prompt_key_command("Enter")).toBe(
      LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND.NONE,
    );
  });
});
