import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_player_use_cases } from "./PlayerUseCases";
import {
  create_mock_player,
  create_mock_repository,
  create_valid_player_input,
} from "./PlayerUseCases.test_support";

describe("PlayerUseCases", () => {
  let mock_repository: PlayerRepository;
  let use_cases: ReturnType<typeof create_player_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_use_cases(mock_repository);
  });

  describe("create", () => {
    it("creates player with valid input", async () => {
      const input = create_valid_player_input();
      const created_player = create_mock_player({ ...input, id: "new_player" });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_player,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.id).toBe("new_player");
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("returns validation error when first name is missing", async () => {
      const input = create_valid_player_input({ first_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("First name is required");
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("returns validation error when last name is missing", async () => {
      const input = create_valid_player_input({ last_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Last name is required");
    });

    it("returns validation error when date of birth is missing", async () => {
      const input = create_valid_player_input({ date_of_birth: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Date of birth is required");
    });

    it("returns validation error when nationality is missing", async () => {
      const input = create_valid_player_input({ nationality: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Nationality is required");
    });

    it("returns validation error when position is missing", async () => {
      const input = create_valid_player_input({ position_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Position is required");
    });

    it("returns multiple validation errors when multiple fields are invalid", async () => {
      const input = create_valid_player_input({
        first_name: "",
        last_name: "",
        date_of_birth: "",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("First name is required");
      expect(result.error).toContain("Last name is required");
      expect(result.error).toContain("Date of birth is required");
    });

    it("returns error when repository fails", async () => {
      const input = create_valid_player_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });
});
