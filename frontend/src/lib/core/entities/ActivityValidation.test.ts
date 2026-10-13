import { describe, expect, it } from "vitest";

import { validate_activity_input } from "./Activity";
import { create_valid_input } from "./ActivityTestBuilders.test_support";

describe("Activity Entity", () => {
  describe("validate_activity_input", () => {
    it("returns valid for a complete valid input", () => {
      const input = create_valid_input();
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("returns error when title is empty", () => {
      const input = create_valid_input({ title: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    it("returns error when title is only whitespace", () => {
      const input = create_valid_input({ title: "   " });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    it("returns error when organization_id is empty", () => {
      const input = create_valid_input({ organization_id: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.organization_id).toBeDefined();
    });

    it("returns error when category_id is empty", () => {
      const input = create_valid_input({ category_id: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.category_id).toBeDefined();
    });

    it("returns error when start_datetime is empty", () => {
      const input = create_valid_input({ start_datetime: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.start_datetime).toBeDefined();
    });

    it("returns error when end_datetime is empty", () => {
      const input = create_valid_input({ end_datetime: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.end_datetime).toBeDefined();
    });

    it("returns error when end is before start", () => {
      const input = create_valid_input({
        start_datetime: "2025-01-15T12:00:00Z",
        end_datetime: "2025-01-15T10:00:00Z",
      });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.end_datetime).toBeDefined();
    });

    it("allows same start and end for all-day events", () => {
      const input = create_valid_input({
        start_datetime: "2025-01-15T00:00:00Z",
        end_datetime: "2025-01-15T00:00:00Z",
        is_all_day: true,
      });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("collects multiple errors", () => {
      const input = create_valid_input({
        title: "",
        organization_id: "",
        category_id: "",
      });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
    });
  });
});
