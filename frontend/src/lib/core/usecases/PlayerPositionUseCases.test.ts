import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerPositionRepository } from "../interfaces/ports";
import { build_player_position_not_found_by_code_error } from "../interfaces/ports";
import { create_failure_result } from "../types/Result";
import { create_player_position_use_cases } from "./PlayerPositionUseCases";
import {
  create_mock_repository,
  create_test_position,
  create_valid_input,
} from "./PlayerPositionUseCases.test_support";

describe("PlayerPositionUseCases", () => {
  let mock_repository: PlayerPositionRepository;
  let use_cases: ReturnType<typeof create_player_position_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_position_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all positions when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_position()],
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
    it("should return position when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_position(),
      });

      const result = await use_cases.get_by_id("position-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(
        create_failure_result(
          build_player_position_not_found_by_code_error("ST"),
        ),
      );
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_position(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty name", async () => {
      const result = await use_cases.create(create_valid_input({ name: "" }));

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_position(),
      });
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(
        create_failure_result(
          build_player_position_not_found_by_code_error("GK"),
        ),
      );
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_position(),
      });

      const result = await use_cases.update("position-123", {
        name: "Updated",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("position-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_positions_by_sport", () => {
    it("should return positions for sport", async () => {
      vi.mocked(mock_repository.find_by_sport_type).mockResolvedValue({
        success: true,
        data: [create_test_position()],
      });

      const result = await use_cases.list_positions_by_sport("Football");

      expect(result.success).toBe(true);
    });

    it("should fail for empty sport_id", async () => {
      const result = await use_cases.list_positions_by_sport("");

      expect(result.success).toBe(false);
    });
  });
});
