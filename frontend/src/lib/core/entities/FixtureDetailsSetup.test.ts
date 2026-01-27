import { describe, expect, it } from "vitest";
import {
  create_empty_fixture_details_setup_input,
  create_empty_official_assignment,
  validate_fixture_details_setup_input,
  type OfficialAssignment,
  type CreateFixtureDetailsSetupInput,
} from "./FixtureDetailsSetup";

describe("FixtureDetailsSetup", () => {
  describe("create_empty_fixture_details_setup_input", () => {
    it("returns empty input with one default empty assignment", () => {
      const input = create_empty_fixture_details_setup_input();

      expect(input.fixture_id).toBe("");
      expect(input.home_team_jersey_id).toBe("");
      expect(input.away_team_jersey_id).toBe("");
      expect(input.official_jersey_id).toBe("");
      expect(input.assigned_officials).toHaveLength(1);
      expect(input.assigned_officials[0].official_id).toBe("");
      expect(input.assigned_officials[0].role_id).toBe("");
      expect(input.assignment_notes).toBe("");
      expect(input.confirmation_status).toBe("pending");
      expect(input.status).toBe("active");
    });

    it("accepts fixture_id parameter", () => {
      const input = create_empty_fixture_details_setup_input("fixture_123");

      expect(input.fixture_id).toBe("fixture_123");
    });
  });

  describe("create_empty_official_assignment", () => {
    it("returns empty official assignment", () => {
      const assignment = create_empty_official_assignment();

      expect(assignment.official_id).toBe("");
      expect(assignment.role_id).toBe("");
    });
  });

  describe("validate_fixture_details_setup_input", () => {
    const create_valid_input = (): CreateFixtureDetailsSetupInput => ({
      fixture_id: "fixture_123",
      home_team_jersey_id: "jersey_home",
      away_team_jersey_id: "jersey_away",
      official_jersey_id: "jersey_official",
      assigned_officials: [{ official_id: "official_1", role_id: "role_1" }],
      assignment_notes: "",
      confirmation_status: "pending",
      status: "active",
    });

    it("validates a correct input with no errors", () => {
      const input = create_valid_input();
      const result = validate_fixture_details_setup_input(input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("requires fixture_id", () => {
      const input = create_valid_input();
      input.fixture_id = "";

      const result = validate_fixture_details_setup_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.fixture_id).toBe("Fixture is required");
    });

    it("requires at least one official assignment", () => {
      const input = create_valid_input();
      input.assigned_officials = [];

      const result = validate_fixture_details_setup_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.assigned_officials).toBe(
        "At least one official must be assigned",
      );
    });

    it("validates that each official assignment has an official_id", () => {
      const input = create_valid_input();
      input.assigned_officials = [{ official_id: "", role_id: "role_1" }];

      const result = validate_fixture_details_setup_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors["assigned_officials_0_official"]).toBe(
        "Official 1 is required",
      );
    });

    it("validates that each official assignment has a role_id", () => {
      const input = create_valid_input();
      input.assigned_officials = [{ official_id: "official_1", role_id: "" }];

      const result = validate_fixture_details_setup_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors["assigned_officials_0_role"]).toBe(
        "Role for official 1 is required",
      );
    });

    it("validates multiple official assignments", () => {
      const input = create_valid_input();
      input.assigned_officials = [
        { official_id: "official_1", role_id: "role_1" },
        { official_id: "", role_id: "role_2" },
        { official_id: "official_3", role_id: "" },
      ];

      const result = validate_fixture_details_setup_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors["assigned_officials_1_official"]).toBe(
        "Official 2 is required",
      );
      expect(result.errors["assigned_officials_2_role"]).toBe(
        "Role for official 3 is required",
      );
    });

    it("allows optional jersey fields to be empty", () => {
      const input = create_valid_input();
      input.home_team_jersey_id = "";
      input.away_team_jersey_id = "";
      input.official_jersey_id = "";

      const result = validate_fixture_details_setup_input(input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe("OfficialAssignment type", () => {
    it("has correct structure", () => {
      const assignment: OfficialAssignment = {
        official_id: "official_123",
        role_id: "role_456",
      };

      expect(assignment.official_id).toBe("official_123");
      expect(assignment.role_id).toBe("role_456");
    });
  });
});
