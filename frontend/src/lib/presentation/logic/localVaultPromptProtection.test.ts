import { beforeEach, describe, expect, it, vi } from "vitest";

import { submit_local_vault_protection } from "./localVaultPromptActions";
import {
  create_context,
  PENDING_KEY,
} from "./localVaultPromptActions.test_support";
import { sign_out_instead_of_local_vault_protection } from "./localVaultPromptChoices";

describe("submit_local_vault_protection", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("creates a fingerprint unlock for the signed-in user", async () => {
    const { gate, vault_service, context } = create_context();
    const waiting = gate.wait_for_protection("passkey", "coach@example.com");

    await submit_local_vault_protection(context, { method: "passkey" });

    expect(vault_service.create_passkey_unlock).toHaveBeenCalledWith(
      "coach@example.com",
    );
    await expect(waiting).resolves.toEqual({
      kind: "protected",
      pending: PENDING_KEY,
    });
  });

  it.each([
    ["12345", "12345", "at least 6 characters"],
    ["123456", "654321", "do not match"],
  ])(
    "rejects PIN %s / %s before calling the vault",
    async (pin, again, text) => {
      const { gate, vault_service, context } = create_context();
      void gate.wait_for_protection("pin", "coach@example.com");

      await submit_local_vault_protection(context, {
        method: "pin",
        pin,
        pin_confirmation: again,
      });

      expect(vault_service.create_pin_unlock).not.toHaveBeenCalled();
      const prompt_state = gate.current() as { phase: { message: string } };
      expect(prompt_state.phase.message).toContain(text);
    },
  );

  it("lets the user retry when fingerprint setup is cancelled", async () => {
    const { gate, vault_service, context } = create_context();
    void gate.wait_for_protection("passkey", "coach@example.com");
    vault_service.create_passkey_unlock.mockResolvedValueOnce({
      success: false,
      error: "NotAllowedError",
    } as never);

    await submit_local_vault_protection(context, { method: "passkey" });
    await submit_local_vault_protection(context, { method: "passkey" });

    expect(vault_service.create_passkey_unlock).toHaveBeenCalledTimes(2);
    expect(gate.current()).toEqual({ kind: "hidden" });
  });

  it("switches to the PIN form when this device cannot use fingerprint unlock", async () => {
    const { gate, vault_service, context } = create_context();
    void gate.wait_for_protection("passkey", "coach@example.com");
    vault_service.create_passkey_unlock.mockResolvedValueOnce({
      success: false,
      error: "This device can't use fingerprint unlock. Use a PIN instead.",
    } as never);

    await submit_local_vault_protection(context, { method: "passkey" });

    expect(gate.current()).toMatchObject({
      kind: "protect",
      method: "pin",
      phase: {
        status: "failed",
        message: "This device can't use fingerprint unlock. Use a PIN instead.",
      },
    });
  });

  it("signs out instead when the user asks to", async () => {
    const { gate } = create_context();
    const waiting = gate.wait_for_protection("pin", "coach@example.com");

    expect(sign_out_instead_of_local_vault_protection(gate)).toBe(true);
    await expect(waiting).resolves.toEqual({ kind: "sign_out_requested" });
  });
});
