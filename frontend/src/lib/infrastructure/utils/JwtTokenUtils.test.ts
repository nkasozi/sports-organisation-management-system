import { describe, expect, it } from "vitest";

import { base64_url_decode, base64_url_encode } from "./JwtTokenUtils";

const BASE64_URL_ALPHABET_PATTERN = /^[A-Za-z0-9_-]*$/;

describe("JwtTokenUtils base64url", () => {
  it.each([
    ["Arabic", "محمد عبد الله"],
    ["Cyrillic", "Дмитрий Иванов"],
    ["CJK", "山田 太郎"],
    ["emoji", "Ada 🏑⚽️"],
    ["Latin-1", "José Müller"],
    ["ASCII", "Denis Onyango"],
  ])(
    "round-trips a %s display name inside a JSON payload",
    (_label: string, display_name: string) => {
      const payload = JSON.stringify({ user_id: "u1", display_name });

      const encoded = base64_url_encode(payload);

      expect(encoded).toMatch(BASE64_URL_ALPHABET_PATTERN);
      expect(JSON.parse(base64_url_decode(encoded))).toEqual({
        user_id: "u1",
        display_name,
      });
    },
  );

  it("keeps ASCII encoding identical to standard base64url so existing tokens still decode", () => {
    expect(base64_url_encode('{"alg":"HS256","typ":"JWT"}')).toBe(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    );
    expect(base64_url_decode("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")).toBe(
      '{"alg":"HS256","typ":"JWT"}',
    );
  });

  it("uses url-safe characters and strips padding", () => {
    const encoded = base64_url_encode("??>>~~");

    expect(encoded).not.toMatch(/[+/=]/);
    expect(base64_url_decode(encoded)).toBe("??>>~~");
  });

  it("decodes values whose padding was removed", () => {
    expect(base64_url_decode(base64_url_encode("a"))).toBe("a");
    expect(base64_url_decode(base64_url_encode("ab"))).toBe("ab");
  });
});
