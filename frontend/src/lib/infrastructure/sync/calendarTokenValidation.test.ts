import { describe, expect, it } from "vitest";

const VALID_TOKEN_PATTERN = /^[a-zA-Z0-9_-]{1,255}$/;

describe("Calendar token validation", () => {
  it("accepts valid alphanumeric tokens", () => {
    const valid_tokens = [
      "abc123",
      "token_with_underscores",
      "token-with-dashes",
      "MixedCaseToken",
      "a",
      "A".repeat(255),
    ];

    for (const token of valid_tokens) {
      expect(VALID_TOKEN_PATTERN.test(token)).toBe(true);
    }
  });

  it("rejects empty string", () => {
    expect(VALID_TOKEN_PATTERN.test("")).toBe(false);
  });

  it("rejects tokens longer than 255 characters", () => {
    const long_token = "a".repeat(256);
    expect(VALID_TOKEN_PATTERN.test(long_token)).toBe(false);
  });

  it("rejects tokens with special characters", () => {
    const malicious_tokens = [
      "token with spaces",
      "token;injection",
      "token'sql",
      'token"double',
      "token<html>",
      "token/path/traversal",
      "token\\backslash",
      "../../../etc/passwd",
      "token\x00null",
      "token%encoded",
    ];

    for (const token of malicious_tokens) {
      expect(VALID_TOKEN_PATTERN.test(token)).toBe(false);
    }
  });

  it("rejects tokens with unicode characters", () => {
    expect(VALID_TOKEN_PATTERN.test("token\u0000")).toBe(false);
    expect(VALID_TOKEN_PATTERN.test("token€")).toBe(false);
  });
});
