import { describe, it, expect } from "vitest";
import {
  determine_seeding_strategy,
  get_is_public_content_page,
} from "./appInitializer";

describe("get_is_public_content_page", () => {
  it("returns true for /competition-results", () => {
    expect(get_is_public_content_page("/competition-results")).toBe(true);
    expect(get_is_public_content_page("/competition-results/league-cup")).toBe(true);
  });

  it("returns true for /calendar", () => {
    expect(get_is_public_content_page("/calendar")).toBe(true);
  });

  it("returns true for /match-report", () => {
    expect(get_is_public_content_page("/match-report/fix-42")).toBe(true);
  });

  it("returns false for protected pages", () => {
    expect(get_is_public_content_page("/competitions")).toBe(false);
    expect(get_is_public_content_page("/fixtures")).toBe(false);
    expect(get_is_public_content_page("/")).toBe(false);
  });
});

describe("determine_seeding_strategy", () => {
  describe("unauthenticated user on a public content page with seeding complete", () => {
    it("returns 'skip_seeding' to avoid unnecessary work", () => {
      expect(
        determine_seeding_strategy(false, "/competition-results/lgue-1", true, false),
      ).toBe("skip_seeding");
    });

    it("returns 'skip_seeding' for /calendar with seeding complete", () => {
      expect(
        determine_seeding_strategy(false, "/calendar", true, false),
      ).toBe("skip_seeding");
    });

    it("returns 'skip_seeding' for /match-report with seeding complete", () => {
      expect(
        determine_seeding_strategy(false, "/match-report/fix-1", true, false),
      ).toBe("skip_seeding");
    });
  });

  describe("unauthenticated user on a public content page WITHOUT seeding complete", () => {
    it("returns 'local_only' because data must be seeded first", () => {
      expect(
        determine_seeding_strategy(false, "/competition-results", false, false),
      ).toBe("local_only");
    });
  });

  describe("unauthenticated user on a protected page", () => {
    it("returns 'local_only' regardless of seeding state (seeding not done)", () => {
      expect(
        determine_seeding_strategy(false, "/players", false, false),
      ).toBe("local_only");
    });

    it("returns 'local_only' even when seeding is already complete", () => {
      expect(
        determine_seeding_strategy(false, "/players", true, false),
      ).toBe("local_only");
    });
  });

  describe("authenticated user whose session is already synced (returning user after reload)", () => {
    it("returns 'skip_seeding' — local data is fresh, no Convex pull needed", () => {
      expect(
        determine_seeding_strategy(true, "/official-roles", true, true),
      ).toBe("skip_seeding");
    });

    it("returns 'skip_seeding' regardless of which page the user reloads on", () => {
      expect(
        determine_seeding_strategy(true, "/players", false, true),
      ).toBe("skip_seeding");
    });
  });

  describe("authenticated user whose session is NOT yet synced (first login)", () => {
    it("returns 'convex_mandatory' to pull all data from the server", () => {
      expect(
        determine_seeding_strategy(true, "/", true, false),
      ).toBe("convex_mandatory");
    });

    it("returns 'convex_mandatory' even if seeding was previously complete", () => {
      expect(
        determine_seeding_strategy(true, "/fixtures", true, false),
      ).toBe("convex_mandatory");
    });

    it("returns 'convex_mandatory' when seeding was never complete either", () => {
      expect(
        determine_seeding_strategy(true, "/teams", false, false),
      ).toBe("convex_mandatory");
    });
  });
});
