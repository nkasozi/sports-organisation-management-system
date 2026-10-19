import { describe, expect, it } from "vitest";

import { retry_local_vault_storage } from "./localVaultPromptChoices";
import { create_local_vault_prompt_gate } from "./localVaultPromptGate";

describe("retry_local_vault_storage", () => {
  it("re-reads secure storage from the storage error screen", async () => {
    const gate = create_local_vault_prompt_gate(() => true);
    const waiting = gate.wait_for_unlock("retry_storage", "Try again.");

    expect(gate.current()).toMatchObject({
      phase: { status: "failed", message: "Try again." },
    });
    expect(retry_local_vault_storage(gate)).toBe(true);
    await expect(waiting).resolves.toBe("retry");
  });

  it("is ignored on a fingerprint unlock screen", () => {
    const gate = create_local_vault_prompt_gate(() => true);
    void gate.wait_for_unlock("passkey", "");

    expect(retry_local_vault_storage(gate)).toBe(false);
  });

  it("is ignored while the start-over confirmation is showing", () => {
    const gate = create_local_vault_prompt_gate(() => true);
    void gate.wait_for_unlock("retry_storage", "Try again.");
    gate.advance({ type: "start_over_requested" });

    expect(retry_local_vault_storage(gate)).toBe(false);
  });
});
