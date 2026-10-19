import { LOCAL_VAULT_MODE } from "$lib/infrastructure/localVault/localVaultContracts";

import type { LocalVaultProtectionResolution } from "./localVaultPromptGate";
import type { LocalVaultPromptMethod } from "./localVaultPromptState";

const LOCAL_VAULT_PROTECTION_REQUESTED_EVENT =
  "local_vault_sign_in_protection_requested";
const LOCAL_VAULT_PASSKEY_CHECK_FAILED_EVENT =
  "local_vault_passkey_support_check_failed";

interface LocalVaultSignInProtectionDependencies {
  is_passkey_unlock_available(): Promise<boolean>;
  wait_for_protection(
    method: LocalVaultPromptMethod,
    owner_label: string,
  ): Promise<LocalVaultProtectionResolution>;
}

async function choose_protection_method(
  dependencies: LocalVaultSignInProtectionDependencies,
): Promise<LocalVaultPromptMethod> {
  try {
    return (await dependencies.is_passkey_unlock_available())
      ? LOCAL_VAULT_MODE.PASSKEY
      : LOCAL_VAULT_MODE.PIN;
  } catch (error) {
    console.warn("[LocalVault] Fingerprint support could not be checked", {
      event: LOCAL_VAULT_PASSKEY_CHECK_FAILED_EVENT,
      error: String(error),
    });
    return LOCAL_VAULT_MODE.PIN;
  }
}

export async function request_local_vault_sign_in_protection(
  dependencies: LocalVaultSignInProtectionDependencies,
  owner_label: string,
): Promise<LocalVaultProtectionResolution> {
  const method = await choose_protection_method(dependencies);
  console.log("[LocalVault] Asking the user to protect local data", {
    event: LOCAL_VAULT_PROTECTION_REQUESTED_EVENT,
    method,
  });
  return dependencies.wait_for_protection(method, owner_label);
}
