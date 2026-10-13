import { describe, expect, it, vi } from "vitest";

import {
  LOGIN_LOCAL_CHANGE_PROMPT_CHOICE,
  type LoginLocalChangePromptState,
} from "./layoutLoginLocalChangePrompt";
import { create_login_local_change_prompt_gate } from "./layoutLoginLocalChangePromptGate";

function create_recording_gate(): {
  gate: ReturnType<typeof create_login_local_change_prompt_gate>;
  states: LoginLocalChangePromptState[];
} {
  const states: LoginLocalChangePromptState[] = [];
  const gate = create_login_local_change_prompt_gate(
    (prompt_state: LoginLocalChangePromptState) => {
      states.push(prompt_state);
      return true;
    },
  );
  return { gate, states };
}

describe("create_login_local_change_prompt_gate", () => {
  it("shows the prompt and resolves true when the user discards", async () => {
    const { gate, states } = create_recording_gate();

    const confirmation = gate.request_discard_confirmation(2);

    expect(states.at(-1)).toEqual({
      status: "awaiting_choice",
      unsynced_count: 2,
    });
    expect(
      gate.resolve_choice(
        LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.DISCARD_AND_CONTINUE,
      ),
    ).toBe(true);
    expect(await confirmation).toBe(true);
    expect(states.at(-1)).toEqual({
      status: "resolved",
      unsynced_count: 2,
      choice: "discard_and_continue",
    });
  });

  it("resolves false when the user keeps their local changes", async () => {
    const { gate } = create_recording_gate();

    const confirmation = gate.request_discard_confirmation(1);
    gate.resolve_choice(LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.KEEP_AND_SIGN_OUT);

    expect(await confirmation).toBe(false);
  });

  it("ignores a choice when no prompt is awaiting", () => {
    const { gate, states } = create_recording_gate();

    expect(
      gate.resolve_choice(
        LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.DISCARD_AND_CONTINUE,
      ),
    ).toBe(false);
    expect(states).toEqual([]);
  });

  it("only resolves an awaiting prompt once", async () => {
    const { gate } = create_recording_gate();

    const confirmation = gate.request_discard_confirmation(3);
    gate.resolve_choice(LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.KEEP_AND_SIGN_OUT);

    expect(
      gate.resolve_choice(
        LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.DISCARD_AND_CONTINUE,
      ),
    ).toBe(false);
    expect(await confirmation).toBe(false);
  });

  it("declines a concurrent request without disturbing the visible prompt", async () => {
    const { gate, states } = create_recording_gate();
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const first_confirmation = gate.request_discard_confirmation(3);
    const second_confirmation = gate.request_discard_confirmation(4);

    expect(await second_confirmation).toBe(false);
    expect(states.at(-1)).toEqual({
      status: "awaiting_choice",
      unsynced_count: 3,
    });
    gate.resolve_choice(LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.DISCARD_AND_CONTINUE);
    expect(await first_confirmation).toBe(true);
    warn_spy.mockRestore();
  });

  it("declines a request that reports no unsynced changes", async () => {
    const { gate, states } = create_recording_gate();
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await gate.request_discard_confirmation(0)).toBe(false);
    expect(states).toEqual([]);
    warn_spy.mockRestore();
  });
});
