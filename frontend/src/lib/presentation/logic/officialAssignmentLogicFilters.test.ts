import { describe, expect, it } from "vitest";

import {
  build_official_options_from_records,
  build_organization_official_filter,
  get_assignment_error,
  type OfficialRecord,
} from "./officialAssignmentLogic";

describe("officialAssignmentLogic", () => {
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

  describe("build_official_options_from_records", () => {
    it("maps official records to select options with full name label", () => {
      const records = [
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
      ] as OfficialRecord[];

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

    it("returns an empty filter object when organization_id is empty", () => {
      const filter = build_organization_official_filter("");

      expect(filter).toEqual({});
    });
  });
});
