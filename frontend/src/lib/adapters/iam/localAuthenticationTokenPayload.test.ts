import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { base64_url_encode } from "$lib/infrastructure/utils/JwtTokenUtils";

import {
  is_public_viewer_token_payload,
  parse_decoded_token_payload,
  parse_token_payload,
} from "./localAuthenticationTokenPayload";

const VALID_PAYLOAD = {
  user_id: "u1",
  email: "u1@example.com",
  display_name: "User One",
  role: "org_admin",
  organization_id: "org1",
  team_id: "*",
  issued_at: 1,
  expires_at: 2,
};

const INVALID = { success: false, error: "Token payload is invalid" };

describe("localAuthenticationTokenPayload", () => {
  let error_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    error_spy.mockRestore();
  });

  it("parses a complete payload", () => {
    const result = parse_decoded_token_payload(VALID_PAYLOAD);

    expect(result.success && result.data).toMatchObject(VALID_PAYLOAD);
  });

  it("rejects non-object payloads", () => {
    expect(parse_decoded_token_payload(null)).toEqual(INVALID);
    expect(parse_decoded_token_payload([])).toEqual(INVALID);
    expect(parse_decoded_token_payload("x")).toEqual(INVALID);
  });

  it.each([
    ["user_id", 5],
    ["email", 5],
    ["display_name", false],
    ["role", "emperor"],
    ["organization_id", 1],
    ["team_id", 1],
    ["issued_at", "1"],
    ["expires_at", "2"],
  ])("rejects an invalid %s", (field, value) => {
    expect(
      parse_decoded_token_payload({ ...VALID_PAYLOAD, [field]: value }),
    ).toEqual(INVALID);
  });

  it("decodes raw tokens and reports malformed ones", () => {
    const encoded = base64_url_encode(JSON.stringify(VALID_PAYLOAD));

    expect(parse_token_payload(`h.${encoded}.s`).success).toBe(true);
    expect(parse_token_payload(" ")).toEqual({
      success: false,
      error: "Token is empty",
    });
    expect(parse_token_payload("a.b")).toEqual({
      success: false,
      error: "Token format is invalid (expected 3 parts)",
    });
    expect(parse_token_payload("a.%%%.c")).toEqual({
      success: false,
      error: "Failed to decode token payload",
    });
  });

  it("identifies public viewer payloads", () => {
    expect(
      is_public_viewer_token_payload({
        ...VALID_PAYLOAD,
        role: "public_viewer",
      } as never),
    ).toBe(true);
    expect(is_public_viewer_token_payload(VALID_PAYLOAD as never)).toBe(false);
  });
});
