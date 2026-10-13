import { describe, expect, it } from "vitest";

import {
  BRANDING_MIGRATION_DECISION,
  decide_branding_migration,
  keep_usable_social_media_links,
} from "./brandingMigrationPolicy";

describe("branding migration policy", () => {
  it.each(["public_viewer", "player", "team_manager", "official"])(
    "never writes organization settings while reading branding as %s",
    (role) => {
      expect(decide_branding_migration(role)).toBe(
        BRANDING_MIGRATION_DECISION.SKIP_NOT_PERMITTED,
      );
    },
  );

  it.each(["org_admin", "super_admin"])(
    "migrates local branding for %s",
    (role) => {
      expect(decide_branding_migration(role)).toBe(
        BRANDING_MIGRATION_DECISION.MIGRATE,
      );
    },
  );

  it("drops social media links that have no address", () => {
    expect(
      keep_usable_social_media_links([
        { platform: "facebook", url: "" },
        { platform: "x", url: "   " },
        { platform: "instagram", url: "https://instagram.com/uha" },
      ] as never),
    ).toEqual([{ platform: "instagram", url: "https://instagram.com/uha" }]);
  });
});
