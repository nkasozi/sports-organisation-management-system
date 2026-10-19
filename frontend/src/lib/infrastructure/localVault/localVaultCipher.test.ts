import { describe, expect, it } from "vitest";

import {
  LOCAL_VAULT_NONCE_LENGTH_BYTES,
  open_local_bytes,
  open_local_json,
  seal_local_bytes,
  seal_local_json,
} from "./localVaultCipher";

const DATA_KEY = new Uint8Array(32).fill(7);
const OTHER_DATA_KEY = new Uint8Array(32).fill(9);
const ASSOCIATED_DATA = new TextEncoder().encode("teams\u0000team_1");
const PLAINTEXT = new TextEncoder().encode("secret team roster");
const GCM_TAG_LENGTH_BYTES = 16;

describe("local vault cipher", () => {
  it("seals bytes as nonce followed by ciphertext and tag", () => {
    const sealed = seal_local_bytes(DATA_KEY, PLAINTEXT, ASSOCIATED_DATA);
    expect(sealed.length).toBe(
      LOCAL_VAULT_NONCE_LENGTH_BYTES + PLAINTEXT.length + GCM_TAG_LENGTH_BYTES,
    );
    expect(new TextDecoder().decode(sealed)).not.toContain("secret");
  });

  it("uses a fresh nonce for every seal", () => {
    const first = seal_local_bytes(DATA_KEY, PLAINTEXT, ASSOCIATED_DATA);
    const second = seal_local_bytes(DATA_KEY, PLAINTEXT, ASSOCIATED_DATA);
    expect(first).not.toEqual(second);
  });

  it("opens what it sealed", () => {
    const sealed = seal_local_bytes(DATA_KEY, PLAINTEXT, ASSOCIATED_DATA);
    expect(open_local_bytes(DATA_KEY, sealed, ASSOCIATED_DATA)).toEqual({
      success: true,
      data: PLAINTEXT,
    });
  });

  it("fails to open with a different key", () => {
    const sealed = seal_local_bytes(DATA_KEY, PLAINTEXT, ASSOCIATED_DATA);
    expect(
      open_local_bytes(OTHER_DATA_KEY, sealed, ASSOCIATED_DATA).success,
    ).toBe(false);
  });

  it("fails to open altered bytes", () => {
    const sealed = seal_local_bytes(DATA_KEY, PLAINTEXT, ASSOCIATED_DATA);
    sealed[sealed.length - 1] ^= 1;
    expect(open_local_bytes(DATA_KEY, sealed, ASSOCIATED_DATA).success).toBe(
      false,
    );
  });

  it("fails to open with altered associated data", () => {
    const sealed = seal_local_bytes(DATA_KEY, PLAINTEXT, ASSOCIATED_DATA);
    const altered_associated_data = new TextEncoder().encode("teams\u0000x");
    expect(
      open_local_bytes(DATA_KEY, sealed, altered_associated_data).success,
    ).toBe(false);
  });

  it("fails to open a blob shorter than a nonce", () => {
    expect(
      open_local_bytes(DATA_KEY, new Uint8Array(4), ASSOCIATED_DATA).success,
    ).toBe(false);
  });

  it("round trips JSON values", () => {
    const value = { id: "team_1", name: "Lions", tags: ["a"], score: 3 };
    const sealed = seal_local_json(DATA_KEY, value, ASSOCIATED_DATA);
    expect(sealed.success).toBe(true);
    if (!sealed.success) return;
    expect(open_local_json(DATA_KEY, sealed.data, ASSOCIATED_DATA)).toEqual({
      success: true,
      data: value,
    });
  });

  it("fails to seal a value that cannot become JSON", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(seal_local_json(DATA_KEY, circular, ASSOCIATED_DATA).success).toBe(
      false,
    );
  });

  it("fails to open sealed bytes that are not JSON", () => {
    const sealed = seal_local_bytes(DATA_KEY, PLAINTEXT, ASSOCIATED_DATA);
    expect(open_local_json(DATA_KEY, sealed, ASSOCIATED_DATA).success).toBe(
      false,
    );
  });

  it("fails to seal JSON with a key of the wrong length", () => {
    expect(
      seal_local_json(new Uint8Array(5), { id: "x" }, ASSOCIATED_DATA).success,
    ).toBe(false);
  });
});
