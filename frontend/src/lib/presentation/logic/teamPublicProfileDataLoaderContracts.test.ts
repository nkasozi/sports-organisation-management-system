import { describe, expect, it } from "vitest";

import {
  TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND,
  TEAM_PUBLIC_PROFILE_MESSAGE,
  TEAM_PUBLIC_PROFILE_STATUS_SCHEDULED,
  TEAM_PUBLIC_PROFILE_VISIBILITY_PRIVATE,
} from "./teamPublicProfileDataLoaderContracts";

describe("teamPublicProfileDataLoaderContracts", () => {
  it("defines stable visibility, status, and error constants", () => {
    expect(TEAM_PUBLIC_PROFILE_VISIBILITY_PRIVATE).toBe("private");
    expect(TEAM_PUBLIC_PROFILE_STATUS_SCHEDULED).toBe("scheduled");
    expect(TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND).toEqual({
      not_found: "not_found",
      restricted: "restricted",
      unavailable: "unavailable",
    });
    expect(TEAM_PUBLIC_PROFILE_MESSAGE).toEqual({
      not_found: "Team profile not found",
      restricted: "This profile is private",
      unavailable: "Team information not available",
    });
  });
});
