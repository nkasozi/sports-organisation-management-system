import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IdentificationRepository } from "../interfaces/ports";
import { create_identification_use_cases } from "./IdentificationUseCases";
import {
  create_mock_repository,
  create_test_identification,
  create_valid_input,
} from "./IdentificationUseCases.test_support";

describe("IdentificationUseCases", () => {
  let mock_repository: IdentificationRepository;
  let use_cases: ReturnType<typeof create_identification_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_identification_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all identifications", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_identification()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
    });
  });

  describe("get_by_id", () => {
    it("should return identification when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_identification(),
      });

      const result = await use_cases.get_by_id("id-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_identification(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty entity_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ holder_id: "" }),
      );

      expect(result.success).toBe(false);
    });

    it("should fail for empty value", async () => {
      const result = await use_cases.create(
        create_valid_input({ identifier_value: "" }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_identification(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_identification(),
      });

      const result = await use_cases.update("id-123", {
        identifier_value: "NEWID123",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", {
        identifier_value: "NEWID123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("id-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_identifications_by_entity", () => {
    it("should return identifications for entity", async () => {
      vi.mocked(mock_repository.find_by_holder).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_identification()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_identifications_by_entity(
        "player",
        "player-123",
      );

      expect(result.success).toBe(true);
    });

    it("should fail for empty entity_id", async () => {
      const result = await use_cases.list_identifications_by_entity(
        "player",
        "",
      );

      expect(result.success).toBe(false);
    });
  });
});
