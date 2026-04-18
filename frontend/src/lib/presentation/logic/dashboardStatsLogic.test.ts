import { describe, expect, it } from "vitest";

import { build_dashboard_filters } from "./dashboardStatsLogic";

describe("build_dashboard_filters", () => {
  describe("super_admin role", () => {
    it("returns no organization filter for super_admin", () => {
      const filters = build_dashboard_filters("super_admin", "*");

      expect(filters.organization_scope_state).toEqual({
        status: "unscoped",
      });
    });

    it("returns fixture filter without organization_id for super_admin", () => {
      const filters = build_dashboard_filters("super_admin", "*");

      expect(filters.fixture_status).toBe("scheduled");
    });

    it("returns null organization count override for super_admin", () => {
      const filters = build_dashboard_filters("super_admin", "*");

      expect(filters.organization_count_state).toEqual({
        status: "calculated",
      });
    });
  });

  describe("org_admin role", () => {
    it("returns organization filter with user org_id", () => {
      const filters = build_dashboard_filters("org_admin", "org_456");

      expect(filters.organization_scope_state).toEqual({
        status: "scoped",
        organization_id: "org_456",
      });
    });

    it("returns fixture filter scoped to user organization", () => {
      const filters = build_dashboard_filters("org_admin", "org_456");

      expect(filters.fixture_status).toBe("scheduled");
    });

    it("returns 1 as organization count override", () => {
      const filters = build_dashboard_filters("org_admin", "org_456");

      expect(filters.organization_count_state).toEqual({
        status: "fixed",
        value: 1,
      });
    });
  });

  describe("team_manager role", () => {
    it("returns organization filter scoped to user org", () => {
      const filters = build_dashboard_filters("team_manager", "org_789");

      expect(filters.organization_scope_state).toEqual({
        status: "scoped",
        organization_id: "org_789",
      });
    });

    it("returns fixture filter scoped to user organization", () => {
      const filters = build_dashboard_filters("team_manager", "org_789");

      expect(filters.fixture_status).toBe("scheduled");
    });

    it("returns 1 as organization count override", () => {
      const filters = build_dashboard_filters("team_manager", "org_789");

      expect(filters.organization_count_state).toEqual({
        status: "fixed",
        value: 1,
      });
    });
  });

  describe("officials_manager role", () => {
    it("scopes data to user organization", () => {
      const filters = build_dashboard_filters("officials_manager", "org_abc");

      expect(filters.organization_scope_state).toEqual({
        status: "scoped",
        organization_id: "org_abc",
      });
      expect(filters.fixture_status).toBe("scheduled");
      expect(filters.organization_count_state).toEqual({
        status: "fixed",
        value: 1,
      });
    });
  });

  describe("player role", () => {
    it("scopes data to user organization", () => {
      const filters = build_dashboard_filters("player", "org_def");

      expect(filters.organization_scope_state).toEqual({
        status: "scoped",
        organization_id: "org_def",
      });
      expect(filters.fixture_status).toBe("scheduled");
      expect(filters.organization_count_state).toEqual({
        status: "fixed",
        value: 1,
      });
    });
  });

  describe("official role", () => {
    it("scopes data to user organization", () => {
      const filters = build_dashboard_filters("official", "org_ghi");

      expect(filters.organization_scope_state).toEqual({
        status: "scoped",
        organization_id: "org_ghi",
      });
      expect(filters.fixture_status).toBe("scheduled");
      expect(filters.organization_count_state).toEqual({
        status: "fixed",
        value: 1,
      });
    });
  });
});
