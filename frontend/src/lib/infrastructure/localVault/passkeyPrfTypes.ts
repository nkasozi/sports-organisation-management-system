import type { AsyncResult } from "$lib/core/types/Result";

export type PasskeyCredentialsApi = Pick<
  CredentialsContainer,
  "create" | "get"
>;

export interface PasskeyCapabilityChecks {
  is_platform_authenticator_available(): Promise<boolean>;
  read_client_capabilities(): Promise<Record<string, boolean>>;
}

export interface PasskeyPlatform {
  credentials: PasskeyCredentialsApi;
  capability_checks: PasskeyCapabilityChecks;
}

export interface PasskeyPrfReference {
  credential_id: string;
  prf_salt: Uint8Array;
}

export interface PasskeyPrfSecret extends PasskeyPrfReference {
  secret: Uint8Array;
}

export interface CreatePasskeyPrfCommand {
  relying_party_id: string;
  owner_label: string;
}

export interface PasskeyPrfAuthenticator {
  is_available(): Promise<boolean>;
  create_secret(
    command: CreatePasskeyPrfCommand,
  ): AsyncResult<PasskeyPrfSecret>;
  read_secret(reference: PasskeyPrfReference): AsyncResult<PasskeyPrfSecret>;
}
