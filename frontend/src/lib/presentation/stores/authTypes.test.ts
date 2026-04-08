import { describe, expect, expectTypeOf, it } from "vitest";

import {
  AUTH_STORAGE_KEY,
  type AuthState,
  PROFILE_STORAGE_KEY,
  type UserProfile,
} from "./authTypes";

describe("authTypes", () => {
  it("uses stable namespaced storage keys", () => {
    expect(AUTH_STORAGE_KEY).toBe("sports-org-auth-token");
    expect(PROFILE_STORAGE_KEY).toBe("sports-org-current-profile-id");
    expect(AUTH_STORAGE_KEY.startsWith("sports-org-")).toBe(true);
    expect(PROFILE_STORAGE_KEY.startsWith("sports-org-")).toBe(true);
    expect(AUTH_STORAGE_KEY).not.toBe(PROFILE_STORAGE_KEY);
  });

  it("declares auth state around a nullable current profile", () => {
    expectTypeOf<
      AuthState["current_profile"]
    >().toEqualTypeOf<UserProfile | null>();
  });
});
