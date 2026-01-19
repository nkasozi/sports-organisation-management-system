import { describe, it, expect } from "vitest";
import {
  validate_qualification_input,
  create_empty_qualification_input,
  is_qualification_expired,
  get_days_until_expiry,
  type CreateQualificationInput,
  type QualificationHolderType,
} from "./Qualification";

describe("Qualification Entity", () => {
  describe("validate_qualification_input", () => {
    it("should return no errors for valid input", () => {
      const valid_input: CreateQualificationInput = {
        holder_type: "official",
        holder_id: "official-123",
        certification_name: "FIFA Referee License",
        certification_level: "national",
        certification_number: "REF-2024-001",
        issuing_authority: "FIFA",
        issue_date: "2024-01-15",
        expiry_date: "2026-01-15",
        specializations: ["VAR", "Assistant Referee"],
        notes: "",
        status: "active",
      };

      const errors = validate_qualification_input(valid_input);
      expect(errors).toHaveLength(0);
    });

    it("should require holder_type", () => {
      const input = create_empty_qualification_input("official", "");
      input.holder_type = "" as QualificationHolderType;

      const errors = validate_qualification_input(input);
      expect(errors).toContain("Holder type is required");
    });

    it("should require holder_id", () => {
      const input = create_empty_qualification_input("official", "");

      const errors = validate_qualification_input(input);
      expect(errors).toContain("Holder ID is required");
    });

    it("should require certification_name", () => {
      const input = create_empty_qualification_input(
        "official",
        "official-123",
      );
      input.certification_name = "";

      const errors = validate_qualification_input(input);
      expect(errors).toContain("Certification name is required");
    });

    it("should require certification_level", () => {
      const input = create_empty_qualification_input(
        "official",
        "official-123",
      );
      input.certification_name = "Test Cert";
      input.certification_level = "" as any;

      const errors = validate_qualification_input(input);
      expect(errors).toContain("Certification level is required");
    });

    it("should validate that expiry_date is after issue_date when both provided", () => {
      const input = create_empty_qualification_input(
        "official",
        "official-123",
      );
      input.certification_name = "Test Cert";
      input.issue_date = "2025-01-01";
      input.expiry_date = "2024-01-01";

      const errors = validate_qualification_input(input);
      expect(errors).toContain("Expiry date must be after issue date");
    });
  });

  describe("is_qualification_expired", () => {
    it("should return false when no expiry date", () => {
      const result = is_qualification_expired("");
      expect(result).toBe(false);
    });

    it("should return true when expiry date is in the past", () => {
      const past_date = "2020-01-01";
      const result = is_qualification_expired(past_date);
      expect(result).toBe(true);
    });

    it("should return false when expiry date is in the future", () => {
      const future_date = "2030-01-01";
      const result = is_qualification_expired(future_date);
      expect(result).toBe(false);
    });
  });

  describe("get_days_until_expiry", () => {
    it("should return null when no expiry date", () => {
      const result = get_days_until_expiry("");
      expect(result).toBeNull();
    });

    it("should return negative number for expired qualifications", () => {
      const past_date = new Date();
      past_date.setDate(past_date.getDate() - 10);
      const result = get_days_until_expiry(
        past_date.toISOString().split("T")[0],
      );
      expect(result).toBeLessThan(0);
    });

    it("should return positive number for valid qualifications", () => {
      const future_date = new Date();
      future_date.setDate(future_date.getDate() + 30);
      const result = get_days_until_expiry(
        future_date.toISOString().split("T")[0],
      );
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("create_empty_qualification_input", () => {
    it("should create input for official holder type", () => {
      const input = create_empty_qualification_input(
        "official",
        "official-123",
      );

      expect(input.holder_type).toBe("official");
      expect(input.holder_id).toBe("official-123");
      expect(input.certification_name).toBe("");
      expect(input.certification_level).toBe("local");
      expect(input.status).toBe("active");
    });

    it("should create input for team_staff holder type", () => {
      const input = create_empty_qualification_input("team_staff", "staff-456");

      expect(input.holder_type).toBe("team_staff");
      expect(input.holder_id).toBe("staff-456");
    });

    it("should set expiry date one year from now by default", () => {
      const input = create_empty_qualification_input(
        "official",
        "official-123",
      );
      const one_year_from_now = new Date();
      one_year_from_now.setFullYear(one_year_from_now.getFullYear() + 1);

      const input_expiry = new Date(input.expiry_date);
      const expected_expiry = one_year_from_now;

      expect(input_expiry.getFullYear()).toBe(expected_expiry.getFullYear());
    });
  });
});
