import { describe, expect, it } from "vitest";

import {
  type CreateActivityCategoryInput,
  validate_activity_category_input,
} from "./ActivityCategory";

describe("ActivityCategory Entity", () => {
  describe("validate_activity_category_input", () => {
    const create_valid_input = (
      overrides: Partial<CreateActivityCategoryInput> = {},
    ): CreateActivityCategoryInput => ({
      name: "Training Sessions",
      description: "Regular team training activities",
      organization_id: "org-123",
      category_type: "training",
      color: "#10B981",
      icon: "dumbbell",
      is_system_generated: false,
      ...overrides,
    });

    it("returns valid for a complete valid input", () => {
      const input = create_valid_input();
      const result = validate_activity_category_input(input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("returns error when name is empty", () => {
      const input = create_valid_input({ name: "" });
      const result = validate_activity_category_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it("returns error when name is only whitespace", () => {
      const input = create_valid_input({ name: "   " });
      const result = validate_activity_category_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it("returns error when organization_id is empty", () => {
      const input = create_valid_input({ organization_id: "" });
      const result = validate_activity_category_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.organization_id).toBeDefined();
    });

    it("returns error when color is empty", () => {
      const input = create_valid_input({ color: "" });
      const result = validate_activity_category_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.color).toBeDefined();
    });

    it("accepts valid 3-character hex color", () => {
      const input = create_valid_input({ color: "#F00" });
      const result = validate_activity_category_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("accepts valid 6-character hex color", () => {
      const input = create_valid_input({ color: "#FF0000" });
      const result = validate_activity_category_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("collects multiple errors", () => {
      const input = create_valid_input({
        name: "",
        organization_id: "",
        color: "",
      });
      const result = validate_activity_category_input(input);

      expect(result.is_valid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
    });
  });
});
