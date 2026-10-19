import { describe, expect, it, vi } from "vitest";

import { create_local_vault_prompt_gate } from "./localVaultPromptGate";

const PENDING_KEY = { data_key: new Uint8Array(32), record: {} } as never;

describe("create_local_vault_prompt_gate", () => {
  it("shows the unlock prompt and hides it once the unlock finishes", async () => {
    const on_change = vi.fn(() => true);
    const gate = create_local_vault_prompt_gate(on_change);

    const waiting = gate.wait_for_unlock("passkey", "");

    expect(gate.current()).toMatchObject({ kind: "unlock", method: "passkey" });
    expect(gate.finish_unlock("unlocked")).toBe(true);
    await expect(waiting).resolves.toBe("unlocked");
    expect(gate.current()).toEqual({ kind: "hidden" });
    expect(on_change).toHaveBeenLastCalledWith({ kind: "hidden" });
  });

  it("resolves the protection prompt with the new pending key", async () => {
    const gate = create_local_vault_prompt_gate(() => true);

    const waiting = gate.wait_for_protection("pin", "coach@example.com");

    expect(gate.current()).toMatchObject({
      kind: "protect",
      owner_label: "coach@example.com",
    });
    gate.finish_protection({ kind: "protected", pending: PENDING_KEY });
    await expect(waiting).resolves.toEqual({
      kind: "protected",
      pending: PENDING_KEY,
    });
  });

  it("refuses to finish a prompt that is not waiting", () => {
    const gate = create_local_vault_prompt_gate(() => true);

    expect(gate.finish_unlock("unlocked")).toBe(false);
    void gate.wait_for_unlock("pin", "");
    expect(gate.finish_protection({ kind: "sign_out_requested" })).toBe(false);
    expect(gate.current()).toMatchObject({ kind: "unlock" });
  });

  it("applies prompt events and reports each change", () => {
    const on_change = vi.fn(() => true);
    const gate = create_local_vault_prompt_gate(on_change);
    void gate.wait_for_unlock("pin", "");

    gate.advance({ type: "submit_started" });

    expect(gate.current()).toMatchObject({ phase: { status: "working" } });
    expect(on_change).toHaveBeenCalledTimes(2);
  });

  it("shows a blocking message when local data cannot be opened", () => {
    const gate = create_local_vault_prompt_gate(() => true);

    gate.show_unavailable("Reload the page");

    expect(gate.current()).toEqual({
      kind: "unavailable",
      message: "Reload the page",
    });
  });
});
