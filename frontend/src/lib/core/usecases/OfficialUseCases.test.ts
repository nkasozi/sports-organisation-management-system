import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OfficialRepository } from "../interfaces/ports";
import { create_official_use_cases } from "./OfficialUseCases";
import {
  create_mock_repository,
  create_test_official,
  create_valid_input,
} from "./OfficialUseCases.test_support";

describe("OfficialUseCases", () => {
  let mock_repository: OfficialRepository;
  let use_cases: ReturnType<typeof create_official_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_official_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all officials when no filter", async () => {
      const officials = [
        create_test_official({ id: "1" }),
        create_test_official({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: officials,
          total_count: 2,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { organization_id: "org-123" };
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_official()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });
  });

  describe("get_by_id", () => {
    it("should return official when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_official(),
      });

      const result = await use_cases.get_by_id("official-123");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.first_name).toBe("John");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Official ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_official(),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for empty first_name", async () => {
      const input = create_valid_input({ first_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail for empty last_name", async () => {
      const input = create_valid_input({ last_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail for invalid experience and profile image scalars", async () => {
      const input = create_valid_input({
        years_of_experience: -1,
        profile_image_url: "javascript:alert(1)",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain(
        "Years of experience must be zero or greater",
      );
      expect(result.error).toContain("Profile image URL is invalid");
    });
  });
});
