import { describe, it, expect } from "vitest";
import { build_dashboard_filters } from "./dashboardStatsLogic";

describe("build_dashboard_filters", () => {
  describe("super_admin role", () => {
    it("returns no organization filter for super_admin", () => {
      const filters = build_dashboard_filters("super_admin", "org_123");

      expect(filters.organization_filter).toBeUndefined();
    });

    it("returns fixture filter without organization_id for super_admin", () => {
      const filters = build_dashboard_filters("super_admin", "org_123");

      expect(filters.fixture_filter).toEqual({ status: "scheduled" });
    });

    it("returns null organization count override for super_admin", () => {
      const filters = build_dashboard_filters("super_admin", "org_123");

      expect(filters.organization_count_override).toBeNull();
    });
  });

  describe("org_admin role", () => {
    it("returns organization filter with user org_id", () => {
      const filters = build_dashboard_filters("org_admin", "org_456");

      expect(filters.organization_filter).toEqual({
        organization_id: "org_456",
      });
    });

    it("returns fixture filter scoped to user organization", () => {
      const filters = build_dashboard_filters("org_admin", "org_456");

      expect(filters.fixture_filter).toEqual({
        status: "scheduled",
        organization_id: "org_456",
      });
    });

    it("returns 1 as organization count override", () => {
      const filters = build_dashboard_filters("org_admin", "org_456");

      expect(filters.organization_count_override).toBe(1);
    });
  });

  describe("team_manager role", () => {
    it("returns organization filter scoped to user org", () => {
      const filters = build_dashboard_filters("team_manager", "org_789");

      expect(filters.organization_filter).toEqual({
        organization_id: "org_789",
      });
    });

    it("returns fixture filter scoped to user organization", () => {
      const filters = build_dashboard_filters("team_manager", "org_789");

      expect(filters.fixture_filter).toEqual({
        status: "scheduled",
        organization_id: "org_789",
      });
    });

    it("returns 1 as organization count override", () => {
      const filters = build_dashboard_filters("team_manager", "org_789");

      expect(filters.organization_count_override).toBe(1);
    });
  });

  describe("officials_manager role", () => {
    it("scopes data to user organization", () => {
      const filters = build_dashboard_filters("officials_manager", "org_abc");

      expect(filters.organization_filter).toEqual({
        organization_id: "org_abc",
      });
      expect(filters.fixture_filter.organization_id).toBe("org_abc");
      expect(filters.organization_count_override).toBe(1);
    });
  });

  describe("player role", () => {
    it("scopes data to user organization", () => {
      const filters = build_dashboard_filters("player", "org_def");

      expect(filters.organization_filter).toEqual({
        organization_id: "org_def",
      });
      expect(filters.fixture_filter.organization_id).toBe("org_def");
      expect(filters.organization_count_override).toBe(1);
    });
  });

  describe("official role", () => {
    it("scopes data to user organization", () => {
      const filters = build_dashboard_filters("official", "org_ghi");

      expect(filters.organization_filter).toEqual({
        organization_id: "org_ghi",
      });
      expect(filters.fixture_filter.organization_id).toBe("org_ghi");
      expect(filters.organization_count_override).toBe(1);
    });
  });
});
