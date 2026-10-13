import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UpdatePlayerInput } from "../entities/Player";
import type { PlayerRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_player_use_cases } from "./PlayerUseCases";
import {
  create_mock_player,
  create_mock_repository,
} from "./PlayerUseCases.test_support";

describe("PlayerUseCases", () => {
  let mock_repository: PlayerRepository;
  let use_cases: ReturnType<typeof create_player_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_use_cases(mock_repository);
  });

  describe("update", () => {
    it("updates player with valid input", async () => {
      const update_input = { first_name: "Jane" } as UpdatePlayerInput;
      const updated_player = create_mock_player({
        id: "p1",
        first_name: "Jane",
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: updated_player,
      });

      const result = await use_cases.update("p1", update_input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.first_name).toBe("Jane");
      expect(mock_repository.update).toHaveBeenCalledWith("p1", update_input);
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.update("", { first_name: "Jane" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Player ID is required");
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.update("   ", { first_name: "Jane" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Player ID is required");
    });

    it("returns error when repository fails", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: false,
        error: "Player not found",
      });

      const result = await use_cases.update("nonexistent", {
        first_name: "Jane",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });

  describe("delete", () => {
    it("deletes player successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("p1");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toBe(true);
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("p1");
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Player ID is required");
      expect(mock_repository.delete_by_id).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.delete("   ");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Player ID is required");
    });

    it("returns error when repository fails", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: false,
        error: "Cannot delete player with active memberships",
      });

      const result = await use_cases.delete("p1");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });
});
