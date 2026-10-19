import { beforeEach, describe, expect, it, vi } from "vitest";

import { submit_local_vault_unlock } from "./localVaultPromptActions";
import { create_context } from "./localVaultPromptActions.test_support";
import { confirm_local_vault_start_over } from "./localVaultPromptChoices";

describe("submit_local_vault_unlock", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("unlocks with the fingerprint and releases the startup wait", async () => {
    const { gate, vault_service, context } = create_context();
    const waiting = gate.wait_for_unlock("passkey", "");

    await submit_local_vault_unlock(context, { method: "passkey" });

    expect(vault_service.unlock_with_passkey).toHaveBeenCalledTimes(1);
    await expect(waiting).resolves.toBe("unlocked");
  });

  it("shows a friendly error and keeps waiting when the PIN is wrong", async () => {
    const { gate, vault_service, context } = create_context();
    void gate.wait_for_unlock("pin", "");
    vault_service.unlock_with_pin.mockResolvedValueOnce({
      success: false,
      error: "OperationError",
    } as never);

    const unlocked = await submit_local_vault_unlock(context, {
      method: "pin",
      pin: "123456",
    });

    expect(unlocked).toBe(false);
    expect(gate.current()).toMatchObject({
      kind: "unlock",
      phase: {
        status: "failed",
        message: "That PIN did not unlock your data. Please try again.",
      },
    });
  });

  it("asks for a PIN without calling the vault when the field is empty", async () => {
    const { gate, vault_service, context } = create_context();
    void gate.wait_for_unlock("pin", "");

    await submit_local_vault_unlock(context, { method: "pin", pin: "" });

    expect(vault_service.unlock_with_pin).not.toHaveBeenCalled();
    expect(gate.current()).toMatchObject({
      phase: { status: "failed", message: "Please enter your PIN." },
    });
  });

  it("treats a crashing passkey prompt as a failed attempt", async () => {
    const { gate, vault_service, context } = create_context();
    void gate.wait_for_unlock("passkey", "");
    vault_service.unlock_with_passkey.mockRejectedValueOnce(
      new Error("NotAllowedError"),
    );

    await submit_local_vault_unlock(context, { method: "passkey" });

    expect(gate.current()).toMatchObject({ phase: { status: "failed" } });
  });

  it("shows the vault's own friendly message when it has one", async () => {
    const { gate, vault_service, context } = create_context();
    void gate.wait_for_unlock("passkey", "");
    vault_service.unlock_with_passkey.mockResolvedValueOnce({
      success: false,
      error: "Fingerprint unlock was cancelled.",
    } as never);

    await submit_local_vault_unlock(context, { method: "passkey" });

    expect(gate.current()).toMatchObject({
      phase: { message: "Fingerprint unlock was cancelled." },
    });
  });

  it("ignores clicks when no unlock prompt is showing", async () => {
    const { vault_service, context } = create_context();

    expect(
      await submit_local_vault_unlock(context, { method: "passkey" }),
    ).toBe(false);
    expect(vault_service.unlock_with_passkey).not.toHaveBeenCalled();
  });

  it("starts over only after the user confirms", async () => {
    const { gate } = create_context();
    const waiting = gate.wait_for_unlock("passkey", "");

    expect(confirm_local_vault_start_over(gate)).toBe(false);
    gate.advance({ type: "start_over_requested" });
    expect(confirm_local_vault_start_over(gate)).toBe(true);
    await expect(waiting).resolves.toBe("start_over");
  });
});
