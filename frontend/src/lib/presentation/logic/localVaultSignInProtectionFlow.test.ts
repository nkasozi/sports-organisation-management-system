import { beforeEach, describe, expect, it, vi } from "vitest";

import { request_local_vault_sign_in_protection } from "./localVaultSignInProtectionFlow";

describe("request_local_vault_sign_in_protection", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it.each([
    [true, "passkey"],
    [false, "pin"],
  ])(
    "asks for the right protection when fingerprint support is %s",
    async (passkey_available, method) => {
      const wait_for_protection = vi.fn(async () => ({
        kind: "sign_out_requested" as const,
      }));

      const resolution = await request_local_vault_sign_in_protection(
        {
          is_passkey_unlock_available: async () => passkey_available,
          wait_for_protection,
        },
        "coach@example.com",
      );

      expect(wait_for_protection).toHaveBeenCalledWith(
        method,
        "coach@example.com",
      );
      expect(resolution).toEqual({ kind: "sign_out_requested" });
    },
  );

  it("offers a PIN when fingerprint support cannot be checked", async () => {
    const wait_for_protection = vi.fn(async () => ({
      kind: "sign_out_requested" as const,
    }));

    await request_local_vault_sign_in_protection(
      {
        is_passkey_unlock_available: async () =>
          Promise.reject(new Error("not allowed")),
        wait_for_protection,
      },
      "coach@example.com",
    );

    expect(wait_for_protection).toHaveBeenCalledWith(
      "pin",
      "coach@example.com",
    );
  });
});
