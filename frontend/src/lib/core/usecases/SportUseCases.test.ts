import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SportRepository } from "../interfaces/ports";
import { create_sport_use_cases } from "./SportUseCases";
import {
  create_mock_repository,
  create_test_sport,
  create_valid_input,
} from "./SportUseCases.test_support";

describe("SportUseCases", () => {
  let mock_repository: SportRepository;
  let use_cases: ReturnType<typeof create_sport_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_sport_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all sports when no filter", async () => {
      const sports = [
        create_test_sport({ id: "1" }),
        create_test_sport({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: sports,
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
      const filter = { status: "active" };
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_sport()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });
  });

  describe("get_by_id", () => {
    it("should return sport when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_sport(),
      });

      const result = await use_cases.get_by_id("sport-123");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.name).toBe("Football");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Sport ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_sport({ name: input.name }),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for empty name", async () => {
      const input = create_valid_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_sport({ name: "Updated Sport" }),
      });

      const result = await use_cases.update("sport-123", {
        name: "Updated Sport",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Sport ID is required");
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("sport-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("delete_sports", () => {
    it("should delete multiple", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 2,
      });

      const result = await use_cases.delete_sports(["1", "2"]);

      expect(result.success).toBe(true);
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_sports([]);

      expect(result.success).toBe(false);
    });
  });
});
