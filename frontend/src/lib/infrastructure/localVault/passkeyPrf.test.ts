import { describe, expect, it } from "vitest";

import { LOCAL_VAULT_MESSAGE } from "./localVaultMessages";
import {
  create_fake_passkey_device,
  FAKE_CREDENTIAL_ID_BYTES,
  FAKE_PRF_MODE,
} from "./passkeyPrf.test_support";
import { create_passkey_prf_secret } from "./passkeyPrfCreate";
import { read_passkey_prf_secret } from "./passkeyPrfRead";
import { decode_base64url, encode_base64url } from "./passkeyPrfSupport";

const CREATE_COMMAND = {
  relying_party_id: "localhost",
  owner_label: "coach@example.com",
};
const STORED_REFERENCE = {
  credential_id: encode_base64url(FAKE_CREDENTIAL_ID_BYTES),
  prf_salt: new Uint8Array(32).fill(5),
};

describe("creating a fingerprint passkey", () => {
  it("returns the PRF secret evaluated while creating", async () => {
    const device = create_fake_passkey_device();

    const created = await create_passkey_prf_secret(
      device.credentials,
      CREATE_COMMAND,
    );

    if (!created.success) return expect.unreachable(created.error);
    expect(created.data.credential_id).toBe(
      encode_base64url(FAKE_CREDENTIAL_ID_BYTES),
    );
    expect(created.data.prf_salt.length).toBe(32);
    expect(created.data.secret).toEqual(
      created.data.prf_salt.map((byte: number) => byte ^ 7),
    );
    expect(device.get).not.toHaveBeenCalled();
  });

  it("asks for a platform passkey with required user verification", async () => {
    const device = create_fake_passkey_device();

    const created = await create_passkey_prf_secret(
      device.credentials,
      CREATE_COMMAND,
    );
    expect(created.success).toBe(true);

    const options = device.create.mock.calls[0][0] as CredentialCreationOptions;
    expect(options.publicKey?.rp).toEqual({
      name: "Sport-Sync",
      id: "localhost",
    });
    expect(options.publicKey?.user.name).toBe("coach@example.com");
    expect(options.publicKey?.user.displayName).toBe("coach@example.com");
    expect(options.publicKey?.authenticatorSelection).toEqual({
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    });
  });

  it("verifies once more when PRF is enabled but not evaluated on create", async () => {
    const device = create_fake_passkey_device({
      prf_mode: FAKE_PRF_MODE.ENABLED_ONLY,
    });

    const created = await create_passkey_prf_secret(
      device.credentials,
      CREATE_COMMAND,
    );

    if (!created.success) return expect.unreachable(created.error);
    expect(device.get).toHaveBeenCalledOnce();
    expect(created.data.secret).toEqual(
      created.data.prf_salt.map((byte: number) => byte ^ 7),
    );
  });

  it("reports devices without PRF as unable to use fingerprint unlock", async () => {
    const device = create_fake_passkey_device({
      prf_mode: FAKE_PRF_MODE.UNSUPPORTED,
    });

    const created = await create_passkey_prf_secret(
      device.credentials,
      CREATE_COMMAND,
    );

    expect(created).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PASSKEY_UNAVAILABLE,
    });
  });

  it("turns a cancelled prompt into a friendly failure", async () => {
    const device = create_fake_passkey_device({ cancel_requests: true });

    const created = await create_passkey_prf_secret(
      device.credentials,
      CREATE_COMMAND,
    );

    expect(created).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PASSKEY_CANCELLED,
    });
  });
});

describe("reading a fingerprint passkey secret", () => {
  it("asks only for the stored passkey and returns its PRF secret", async () => {
    const device = create_fake_passkey_device();

    const read = await read_passkey_prf_secret(
      device.credentials,
      STORED_REFERENCE,
    );

    if (!read.success) return expect.unreachable(read.error);
    expect(read.data.secret).toEqual(new Uint8Array(32).fill(5 ^ 7));
    const options = device.get.mock.calls[0][0] as CredentialRequestOptions;
    expect(options.publicKey?.userVerification).toBe("required");
    expect(options.publicKey?.allowCredentials?.[0].id).toEqual(
      FAKE_CREDENTIAL_ID_BYTES,
    );
    expect(
      Object.keys(options.publicKey?.extensions?.prf?.evalByCredential ?? {}),
    ).toEqual([STORED_REFERENCE.credential_id]);
  });

  it("turns a cancelled prompt into a friendly failure", async () => {
    const device = create_fake_passkey_device({ cancel_requests: true });

    const read = await read_passkey_prf_secret(
      device.credentials,
      STORED_REFERENCE,
    );

    expect(read).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PASSKEY_CANCELLED,
    });
  });

  it("fails when the passkey returns no PRF secret", async () => {
    const device = create_fake_passkey_device({
      prf_mode: FAKE_PRF_MODE.UNSUPPORTED,
    });

    const read = await read_passkey_prf_secret(
      device.credentials,
      STORED_REFERENCE,
    );

    expect(read.success).toBe(false);
  });

  it("round-trips credential ids through base64url", () => {
    const bytes = new Uint8Array([0, 251, 255, 62, 63]);

    expect(decode_base64url(encode_base64url(bytes))).toEqual(bytes);
    expect(encode_base64url(bytes)).not.toMatch(/[+/=]/);
  });
});
