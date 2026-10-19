import { describe, expect, it } from "vitest";

import {
  advance_local_vault_prompt_state,
  create_hidden_local_vault_prompt_state,
  create_protect_local_vault_prompt_state,
  create_unavailable_local_vault_prompt_state,
  create_unlock_local_vault_prompt_state,
  is_local_vault_prompt_working,
  type LocalVaultPromptEvent,
  type LocalVaultPromptState,
} from "./localVaultPromptState";

const STARTED: LocalVaultPromptEvent = { type: "submit_started" };
const FAILED: LocalVaultPromptEvent = {
  type: "submit_failed",
  message: "Try again",
};
const START_OVER: LocalVaultPromptEvent = { type: "start_over_requested" };
const CANCEL_START_OVER: LocalVaultPromptEvent = {
  type: "start_over_cancelled",
};

function advance_all(
  state: LocalVaultPromptState,
  events: LocalVaultPromptEvent[],
): LocalVaultPromptState {
  return events.reduce(advance_local_vault_prompt_state, state);
}

describe("advance_local_vault_prompt_state", () => {
  it("moves an unlock prompt from ready to working to failed with a message", () => {
    const state = create_unlock_local_vault_prompt_state("passkey", "");

    const working = advance_local_vault_prompt_state(state, STARTED);
    const failed = advance_local_vault_prompt_state(working, FAILED);

    expect(is_local_vault_prompt_working(working)).toBe(true);
    expect(failed).toEqual({
      kind: "unlock",
      method: "passkey",
      phase: { status: "failed", message: "Try again" },
    });
  });

  it("ignores a failure that arrives when nothing is being tried", () => {
    const state = create_unlock_local_vault_prompt_state("pin", "");

    expect(advance_local_vault_prompt_state(state, FAILED)).toEqual(state);
  });

  it("allows a retry after a failure", () => {
    const state = advance_all(
      create_unlock_local_vault_prompt_state("pin", ""),
      [STARTED, FAILED, STARTED],
    );

    expect(is_local_vault_prompt_working(state)).toBe(true);
  });

  it("asks for confirmation before starting over and can go back", () => {
    const state = create_unlock_local_vault_prompt_state("passkey", "");

    const confirming = advance_local_vault_prompt_state(state, START_OVER);
    const cancelled = advance_local_vault_prompt_state(
      confirming,
      CANCEL_START_OVER,
    );

    expect(confirming).toMatchObject({
      phase: { status: "confirm_start_over" },
    });
    expect(cancelled).toMatchObject({ phase: { status: "ready" } });
  });

  it("does not offer start over while an unlock is in progress", () => {
    const working = advance_local_vault_prompt_state(
      create_unlock_local_vault_prompt_state("passkey", ""),
      STARTED,
    );

    expect(advance_local_vault_prompt_state(working, START_OVER)).toEqual(
      working,
    );
  });

  it("never offers start over on the protection prompt", () => {
    const state = create_protect_local_vault_prompt_state("pin", "a@b.c");

    expect(advance_local_vault_prompt_state(state, START_OVER)).toEqual(state);
  });

  it("leaves hidden and unavailable prompts unchanged", () => {
    const hidden = create_hidden_local_vault_prompt_state();
    const unavailable = create_unavailable_local_vault_prompt_state("Broken");

    expect(advance_local_vault_prompt_state(hidden, STARTED)).toEqual(hidden);
    expect(advance_local_vault_prompt_state(unavailable, STARTED)).toEqual(
      unavailable,
    );
    expect(is_local_vault_prompt_working(unavailable)).toBe(false);
  });
});
