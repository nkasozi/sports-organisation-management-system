import { describe, expect, it } from "vitest";

import { is_auth_error } from "./syncAuthUtils";

describe("is_auth_error", () => {
  it("returns true for authentication_required error", () => {
    expect(is_auth_error("authentication_required: Not authenticated")).toBe(
      true,
    );
  });

  it("returns true for unauthorized error", () => {
    expect(
      is_auth_error('unauthorized: Role "player" does not have permission'),
    ).toBe(true);
  });

  it("returns false for non-auth errors", () => {
    expect(is_auth_error("Network timeout")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(is_auth_error("")).toBe(false);
  });

  it("returns true for Server rejected message", () => {
    expect(
      is_auth_error("Server rejected batch (success=false, results: 0)"),
    ).toBe(true);
  });
});
