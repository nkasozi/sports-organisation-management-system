import { describe, expect, it } from "vitest";

import { create_failure_result } from "$lib/core/types/Result";

import { LOCAL_VAULT_STATUS } from "./localVaultContracts";
import { create_local_vault_service } from "./localVaultService";
import { create_local_vault_test_harness } from "./localVaultService.test_support";

describe("local vault status", () => {
  it("reports an unreadable vault instead of a missing one when storage fails", async () => {
    const harness = create_local_vault_test_harness();
    const service = create_local_vault_service({
      storage: {
        ...harness.storage,
        read_record: async () => create_failure_result("disk busy"),
      },
      unlock_session_storage: harness.unlock_session_storage,
      announce_unlock_session_ended: () => true,
      key_holder: harness.key_holder,
      passkey_authenticator: {} as never,
      read_relying_party_id: () => "localhost",
      read_current_time: () => new Date(),
      pin_iterations: 1000,
    });

    expect(await service.read_status()).toEqual({
      kind: LOCAL_VAULT_STATUS.UNREADABLE,
    });
  });

  it("reports no vault when storage is readable and empty", async () => {
    const harness = create_local_vault_test_harness();

    expect(await harness.service.read_status()).toEqual({
      kind: LOCAL_VAULT_STATUS.NO_VAULT,
    });
  });
});
