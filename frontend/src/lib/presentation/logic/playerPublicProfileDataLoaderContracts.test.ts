import { describe, expect, it } from "vitest";

import {
  PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND,
  PLAYER_PUBLIC_PROFILE_MESSAGE,
  PLAYER_PUBLIC_PROFILE_STATUS_COMPLETED,
  PLAYER_PUBLIC_PROFILE_VISIBILITY_PRIVATE,
} from "./playerPublicProfileDataLoaderContracts";

describe("playerPublicProfileDataLoaderContracts", () => {
  it("defines stable visibility, status, and error constants", () => {
    expect(PLAYER_PUBLIC_PROFILE_VISIBILITY_PRIVATE).toBe("private");
    expect(PLAYER_PUBLIC_PROFILE_STATUS_COMPLETED).toBe("completed");
    expect(PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND).toEqual({
      not_found: "not_found",
      restricted: "restricted",
      unavailable: "unavailable",
    });
    expect(PLAYER_PUBLIC_PROFILE_MESSAGE).toEqual({
      not_found: "Player profile not found",
      restricted: "This profile is private",
      unavailable: "Player information not available",
    });
  });
});
