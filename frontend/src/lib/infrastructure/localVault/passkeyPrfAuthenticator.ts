import { type Option, OptionStatus } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
} from "$lib/core/types/Result";

import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";
import { create_passkey_prf_secret } from "./passkeyPrfCreate";
import { read_passkey_prf_secret } from "./passkeyPrfRead";
import type {
  CreatePasskeyPrfCommand,
  PasskeyCapabilityChecks,
  PasskeyPlatform,
  PasskeyPrfAuthenticator,
  PasskeyPrfReference,
  PasskeyPrfSecret,
} from "./passkeyPrfTypes";

const PRF_CAPABILITY_NAME = "extension:prf";

export async function check_passkey_prf_availability(
  checks: PasskeyCapabilityChecks,
): Promise<boolean> {
  try {
    const has_platform_authenticator =
      await checks.is_platform_authenticator_available();
    if (!has_platform_authenticator) return false;
    const capabilities = await checks.read_client_capabilities();
    return capabilities[PRF_CAPABILITY_NAME] !== false;
  } catch (error) {
    console.warn("[LocalVault] Could not check fingerprint unlock support", {
      event: LOCAL_VAULT_LOG_EVENT.PASSKEY_AVAILABILITY_FAILED,
      error: String(error),
    });
    return false;
  }
}

function run_with_platform(
  platform: Option<PasskeyPlatform>,
  action: (
    available_platform: PasskeyPlatform,
  ) => AsyncResult<PasskeyPrfSecret>,
): AsyncResult<PasskeyPrfSecret> {
  return platform.status === OptionStatus.SOME
    ? action(platform.value)
    : Promise.resolve(
        create_failure_result(LOCAL_VAULT_MESSAGE.PASSKEY_UNAVAILABLE),
      );
}

export function create_passkey_prf_authenticator(
  read_platform: () => Option<PasskeyPlatform>,
): PasskeyPrfAuthenticator {
  return {
    is_available: async () => {
      const platform = read_platform();
      return platform.status === OptionStatus.SOME
        ? check_passkey_prf_availability(platform.value.capability_checks)
        : false;
    },
    create_secret: (command: CreatePasskeyPrfCommand) =>
      run_with_platform(read_platform(), (platform: PasskeyPlatform) =>
        create_passkey_prf_secret(platform.credentials, command),
      ),
    read_secret: (reference: PasskeyPrfReference) =>
      run_with_platform(read_platform(), (platform: PasskeyPlatform) =>
        read_passkey_prf_secret(platform.credentials, reference),
      ),
  };
}
