import { describe, expect, it } from "vitest";
import {
  validate_activity_category_input,
  create_default_categories_for_organization,
  DEFAULT_CATEGORY_COLORS,
  DEFAULT_CATEGORY_ICONS,
  type CreateActivityCategoryInput,
  type ActivityCategoryType,
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

  describe("create_default_categories_for_organization", () => {
    it("creates categories for all standard types", () => {
      const organization_id = "org-123";
      const categories =
        create_default_categories_for_organization(organization_id);

      const expected_types: ActivityCategoryType[] = [
        "competition",
        "fixture",
        "training",
        "administrative",
        "transfer_window",
        "meeting",
        "medical",
        "travel",
      ];

      expect(categories.length).toBe(expected_types.length);

      for (const category_type of expected_types) {
        const found = categories.find((c) => c.category_type === category_type);
        expect(found).toBeDefined();
      }
    });

    it("sets organization_id on all categories", () => {
      const organization_id = "org-456";
      const categories =
        create_default_categories_for_organization(organization_id);

      for (const category of categories) {
        expect(category.organization_id).toBe(organization_id);
      }
    });

    it("marks all default categories as system generated", () => {
      const categories = create_default_categories_for_organization("org-123");

      for (const category of categories) {
        expect(category.is_system_generated).toBe(true);
      }
    });

    it("assigns correct colors from DEFAULT_CATEGORY_COLORS", () => {
      const categories = create_default_categories_for_organization("org-123");

      for (const category of categories) {
        const expected_color = DEFAULT_CATEGORY_COLORS[category.category_type];
        expect(category.color).toBe(expected_color);
      }
    });

    it("assigns correct icons from DEFAULT_CATEGORY_ICONS", () => {
      const categories = create_default_categories_for_organization("org-123");

      for (const category of categories) {
        const expected_icon = DEFAULT_CATEGORY_ICONS[category.category_type];
        expect(category.icon).toBe(expected_icon);
      }
    });

    it("creates unique names for each category type", () => {
      const categories = create_default_categories_for_organization("org-123");
      const names = categories.map((c) => c.name);
      const unique_names = new Set(names);

      expect(unique_names.size).toBe(names.length);
    });
  });

  describe("DEFAULT_CATEGORY_COLORS", () => {
    it("has a color for competition type", () => {
      expect(DEFAULT_CATEGORY_COLORS.competition).toBeDefined();
      expect(DEFAULT_CATEGORY_COLORS.competition).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has a color for fixture type", () => {
      expect(DEFAULT_CATEGORY_COLORS.fixture).toBeDefined();
      expect(DEFAULT_CATEGORY_COLORS.fixture).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has a color for training type", () => {
      expect(DEFAULT_CATEGORY_COLORS.training).toBeDefined();
      expect(DEFAULT_CATEGORY_COLORS.training).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has a color for custom type", () => {
      expect(DEFAULT_CATEGORY_COLORS.custom).toBeDefined();
      expect(DEFAULT_CATEGORY_COLORS.custom).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe("DEFAULT_CATEGORY_ICONS", () => {
    it("has an icon for competition type", () => {
      expect(DEFAULT_CATEGORY_ICONS.competition).toBeDefined();
      expect(typeof DEFAULT_CATEGORY_ICONS.competition).toBe("string");
    });

    it("has an icon for fixture type", () => {
      expect(DEFAULT_CATEGORY_ICONS.fixture).toBeDefined();
      expect(typeof DEFAULT_CATEGORY_ICONS.fixture).toBe("string");
    });

    it("has an icon for training type", () => {
      expect(DEFAULT_CATEGORY_ICONS.training).toBeDefined();
      expect(typeof DEFAULT_CATEGORY_ICONS.training).toBe("string");
    });

    it("has an icon for custom type", () => {
      expect(DEFAULT_CATEGORY_ICONS.custom).toBeDefined();
      expect(typeof DEFAULT_CATEGORY_ICONS.custom).toBe("string");
    });
  });
});
