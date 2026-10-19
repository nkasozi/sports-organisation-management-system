import { describe, expect, it } from "vitest";

import { LOCAL_VAULT_MESSAGE } from "./localVaultMessages";
import { local_vault_service } from "./localVaultServiceInstance";

describe("local vault service instance", () => {
  it("loads outside a browser and reports fingerprint unlock as unavailable", async () => {
    expect(await local_vault_service.is_passkey_unlock_available()).toBe(false);
    expect(await local_vault_service.unlock_with_passkey()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.STORAGE_FAILED,
    });
  });
});
