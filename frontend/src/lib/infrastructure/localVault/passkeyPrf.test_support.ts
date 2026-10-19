import { vi } from "vitest";

import type { PasskeyCredentialsApi } from "./passkeyPrfTypes";

export const FAKE_CREDENTIAL_ID_BYTES = new Uint8Array([11, 22, 33, 44, 250]);

export const FAKE_PRF_MODE = {
  EVALUATED_AT_CREATE: "evaluated_at_create",
  ENABLED_ONLY: "enabled_only",
  UNSUPPORTED: "unsupported",
} as const;

export type FakePrfMode = (typeof FAKE_PRF_MODE)[keyof typeof FAKE_PRF_MODE];

export interface FakePasskeyDeviceConfig {
  device_seed: number;
  prf_mode: FakePrfMode;
  cancel_requests: boolean;
}

export interface FakePasskeyDevice {
  credentials: PasskeyCredentialsApi;
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
}

const DEFAULT_DEVICE_CONFIG: FakePasskeyDeviceConfig = {
  device_seed: 7,
  prf_mode: FAKE_PRF_MODE.EVALUATED_AT_CREATE,
  cancel_requests: false,
};

function to_bytes(source: BufferSource): Uint8Array {
  return ArrayBuffer.isView(source)
    ? new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
    : new Uint8Array(source);
}

function compute_fake_prf_output(
  salt: BufferSource,
  device_seed: number,
): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(to_bytes(salt), (byte: number) => byte ^ device_seed);
}

function create_fake_credential(
  prf: AuthenticationExtensionsPRFOutputs,
): Credential {
  return {
    id: "fake",
    type: "public-key",
    rawId: FAKE_CREDENTIAL_ID_BYTES.slice().buffer,
    getClientExtensionResults: () => ({ prf }),
  } as unknown as Credential;
}

function build_create_prf_outputs(
  options: CredentialCreationOptions,
  config: FakePasskeyDeviceConfig,
): AuthenticationExtensionsPRFOutputs {
  const salt = options.publicKey?.extensions?.prf?.eval?.first;
  switch (config.prf_mode) {
    case FAKE_PRF_MODE.EVALUATED_AT_CREATE:
      return {
        enabled: true,
        results: {
          first: compute_fake_prf_output(
            salt ?? new Uint8Array(),
            config.device_seed,
          ),
        },
      };
    case FAKE_PRF_MODE.ENABLED_ONLY:
      return { enabled: true };
    case FAKE_PRF_MODE.UNSUPPORTED:
      return {};
  }
}

function build_get_prf_outputs(
  options: CredentialRequestOptions,
  config: FakePasskeyDeviceConfig,
): AuthenticationExtensionsPRFOutputs {
  const evaluations = options.publicKey?.extensions?.prf?.evalByCredential;
  const salt = Object.values(evaluations ?? {})[0]?.first;
  if (config.prf_mode === FAKE_PRF_MODE.UNSUPPORTED || !salt) return {};
  return {
    results: { first: compute_fake_prf_output(salt, config.device_seed) },
  };
}

function create_cancellation(): DOMException {
  return new DOMException("The user cancelled", "NotAllowedError");
}

export function create_fake_passkey_device(
  overrides: Partial<FakePasskeyDeviceConfig> = {},
): FakePasskeyDevice {
  const config = { ...DEFAULT_DEVICE_CONFIG, ...overrides };
  const create = vi.fn(async (options: CredentialCreationOptions) =>
    config.cancel_requests
      ? Promise.reject(create_cancellation())
      : create_fake_credential(build_create_prf_outputs(options, config)),
  );
  const get = vi.fn(async (options: CredentialRequestOptions) =>
    config.cancel_requests
      ? Promise.reject(create_cancellation())
      : create_fake_credential(build_get_prf_outputs(options, config)),
  );
  return { credentials: { create, get }, create, get };
}
