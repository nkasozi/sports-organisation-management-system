import { describe, expect, it } from "vitest";

import { select_leaderboard_organization_id } from "./officialLeaderboardPageLoad";

describe("leaderboard opens on an organisation with fixtures", () => {
  const organizations = [{ id: "org_empty" }, { id: "org_busy" }];

  it("skips organisations with no fixtures", () => {
    expect(
      select_leaderboard_organization_id(organizations, [
        { organization_id: "org_busy" },
      ]),
    ).toBe("org_busy");
  });

  it("falls back to the first organisation, or none", () => {
    expect(select_leaderboard_organization_id(organizations, [])).toBe(
      "org_empty",
    );
    expect(select_leaderboard_organization_id([], [])).toBe("");
  });
});
