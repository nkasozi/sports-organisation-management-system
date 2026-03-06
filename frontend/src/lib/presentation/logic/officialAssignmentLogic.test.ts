import { describe, expect, it } from "vitest";
import {
  compute_available_officials,
  get_assignment_error,
  filter_officials_by_organization,
  build_official_options_from_records,
  build_organization_official_filter,
  type SelectOption,
  type OfficialRecord,
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

  describe("filter_officials_by_organization", () => {
    const all_officials: OfficialRecord[] = [
      {
        id: "off_1",
        first_name: "John",
        last_name: "Doe",
        organization_id: "org_a",
      },
      {
        id: "off_2",
        first_name: "Jane",
        last_name: "Smith",
        organization_id: "org_b",
      },
      {
        id: "off_3",
        first_name: "Bob",
        last_name: "Jones",
        organization_id: "org_a",
      },
      {
        id: "off_4",
        first_name: "Alice",
        last_name: "Brown",
        organization_id: "org_c",
      },
    ];

    it("returns only officials matching the given organization_id", () => {
      const filtered = filter_officials_by_organization(all_officials, "org_a");

      expect(filtered).toHaveLength(2);
      expect(filtered.map((o) => o.id)).toEqual(["off_1", "off_3"]);
    });

    it("returns empty array when no officials match the organization_id", () => {
      const filtered = filter_officials_by_organization(
        all_officials,
        "org_nonexistent",
      );

      expect(filtered).toHaveLength(0);
    });

    it("returns all officials when organization_id is empty string", () => {
      const filtered = filter_officials_by_organization(all_officials, "");

      expect(filtered).toHaveLength(4);
    });

    it("returns single matching official for unique organization", () => {
      const filtered = filter_officials_by_organization(all_officials, "org_c");

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("off_4");
    });

    it("handles empty officials array", () => {
      const filtered = filter_officials_by_organization([], "org_a");

      expect(filtered).toHaveLength(0);
    });
  });

  describe("build_official_options_from_records", () => {
    it("maps official records to select options with full name label", () => {
      const records: OfficialRecord[] = [
        {
          id: "off_1",
          first_name: "John",
          last_name: "Doe",
          organization_id: "org_a",
        },
        {
          id: "off_2",
          first_name: "Jane",
          last_name: "Smith",
          organization_id: "org_b",
        },
      ];

      const options = build_official_options_from_records(records);

      expect(options).toEqual([
        { value: "off_1", label: "John Doe" },
        { value: "off_2", label: "Jane Smith" },
      ]);
    });

    it("returns empty array for empty input", () => {
      const options = build_official_options_from_records([]);

      expect(options).toEqual([]);
    });
  });

  describe("build_organization_official_filter", () => {
    it("returns filter object with organization_id when provided", () => {
      const filter = build_organization_official_filter("org_123");

      expect(filter).toEqual({ organization_id: "org_123" });
    });

    it("returns undefined when organization_id is empty", () => {
      const filter = build_organization_official_filter("");

      expect(filter).toBeUndefined();
    });
  });
});
