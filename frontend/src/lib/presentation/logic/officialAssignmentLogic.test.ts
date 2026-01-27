import { describe, expect, it } from "vitest";
import {
  compute_available_officials,
  get_assignment_error,
  type SelectOption,
} from "./officialAssignmentLogic";
import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";

describe("officialAssignmentLogic", () => {
  describe("compute_available_officials", () => {
    const all_officials: SelectOption[] = [
      { value: "official_1", label: "Michael Anderson" },
      { value: "official_2", label: "Sarah Johnson" },
      { value: "official_3", label: "James Williams" },
      { value: "official_4", label: "Emily Davis" },
    ];

    it("returns all officials when no assignments exist", () => {
      const assignments: OfficialAssignment[] = [];

      const available = compute_available_officials(
        all_officials,
        assignments,
        0,
      );

      expect(available).toHaveLength(4);
      expect(available.map((o) => o.value)).toEqual([
        "official_1",
        "official_2",
        "official_3",
        "official_4",
      ]);
    });

    it("returns all officials for the first empty assignment", () => {
      const assignments: OfficialAssignment[] = [
        { official_id: "", role_id: "" },
      ];

      const available = compute_available_officials(
        all_officials,
        assignments,
        0,
      );

      expect(available).toHaveLength(4);
    });

    it("excludes already assigned officials from other indices", () => {
      const assignments: OfficialAssignment[] = [
        { official_id: "official_1", role_id: "role_1" },
        { official_id: "", role_id: "" },
      ];

      const available = compute_available_officials(
        all_officials,
        assignments,
        1,
      );

      expect(available).toHaveLength(3);
      expect(available.map((o) => o.value)).not.toContain("official_1");
    });

    it("includes the current assignment's official in its own dropdown", () => {
      const assignments: OfficialAssignment[] = [
        { official_id: "official_1", role_id: "role_1" },
        { official_id: "official_2", role_id: "role_2" },
      ];

      const available = compute_available_officials(
        all_officials,
        assignments,
        0,
      );

      expect(available).toHaveLength(3);
      expect(available.map((o) => o.value)).toContain("official_1");
      expect(available.map((o) => o.value)).not.toContain("official_2");
    });

    it("excludes multiple assigned officials", () => {
      const assignments: OfficialAssignment[] = [
        { official_id: "official_1", role_id: "role_1" },
        { official_id: "official_2", role_id: "role_2" },
        { official_id: "", role_id: "" },
      ];

      const available = compute_available_officials(
        all_officials,
        assignments,
        2,
      );

      expect(available).toHaveLength(2);
      expect(available.map((o) => o.value)).toEqual([
        "official_3",
        "official_4",
      ]);
    });

    it("handles all officials being assigned except current", () => {
      const assignments: OfficialAssignment[] = [
        { official_id: "official_1", role_id: "role_1" },
        { official_id: "official_2", role_id: "role_2" },
        { official_id: "official_3", role_id: "role_3" },
        { official_id: "official_4", role_id: "role_4" },
      ];

      const available = compute_available_officials(
        all_officials,
        assignments,
        0,
      );

      expect(available).toHaveLength(1);
      expect(available[0].value).toBe("official_1");
    });

    it("returns empty when trying to add fifth assignment and all are taken", () => {
      const assignments: OfficialAssignment[] = [
        { official_id: "official_1", role_id: "role_1" },
        { official_id: "official_2", role_id: "role_2" },
        { official_id: "official_3", role_id: "role_3" },
        { official_id: "official_4", role_id: "role_4" },
        { official_id: "", role_id: "" },
      ];

      const available = compute_available_officials(
        all_officials,
        assignments,
        4,
      );

      expect(available).toHaveLength(0);
    });

    it("ignores empty official_id strings when filtering", () => {
      const assignments: OfficialAssignment[] = [
        { official_id: "", role_id: "role_1" },
        { official_id: "", role_id: "role_2" },
      ];

      const available = compute_available_officials(
        all_officials,
        assignments,
        0,
      );

      expect(available).toHaveLength(4);
    });

    it("handles empty all_officials array", () => {
      const assignments: OfficialAssignment[] = [
        { official_id: "official_1", role_id: "role_1" },
      ];

      const available = compute_available_officials([], assignments, 0);

      expect(available).toHaveLength(0);
    });
  });

  describe("get_assignment_error", () => {
    it("returns error for specific field and index", () => {
      const errors = {
        assigned_officials_0_official: "Official is required",
        assigned_officials_1_role: "Role is required",
      };

      expect(get_assignment_error(errors, 0, "official")).toBe(
        "Official is required",
      );
      expect(get_assignment_error(errors, 1, "role")).toBe("Role is required");
    });

    it("returns empty string when no error exists", () => {
      const errors = {
        assigned_officials_0_official: "Official is required",
      };

      expect(get_assignment_error(errors, 0, "role")).toBe("");
      expect(get_assignment_error(errors, 1, "official")).toBe("");
    });

    it("handles empty errors object", () => {
      const errors = {};

      expect(get_assignment_error(errors, 0, "official")).toBe("");
    });
  });
});
