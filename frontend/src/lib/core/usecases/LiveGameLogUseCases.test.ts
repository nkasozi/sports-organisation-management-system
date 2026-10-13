import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LiveGameLogRepository } from "../interfaces/ports";
import {
  create_live_game_log_use_cases,
  type LiveGameLogUseCases,
} from "./LiveGameLogUseCases";
import {
  create_mock_live_game_log,
  create_mock_repository,
} from "./LiveGameLogUseCases.test_support";

describe("LiveGameLogUseCases", () => {
  let use_cases: LiveGameLogUseCases;
  let mock_repository: LiveGameLogRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_live_game_log_use_cases(mock_repository);
  });

  describe("create", () => {
    it("should create a live game log successfully", async () => {
      const input = {
        organization_id: "org-001",
        fixture_id: "fixture-001",
        home_lineup_id: "lineup-home-001",
        away_lineup_id: "lineup-away-001",
        current_period: "pre_game" as const,
        game_status: "pre_game" as const,
        started_by_user_id: "user-001",
        notes: "",
        status: "active" as const,
      };

      const created_log = create_mock_live_game_log(input);

      vi.mocked(
        mock_repository.get_live_game_log_for_fixture,
      ).mockResolvedValue({
        success: false,
        error: "Not found",
      });

      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_log,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toEqual(created_log);
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("should fail when fixture ID is missing", async () => {
      const input = {
        organization_id: "org-001",
        fixture_id: "",
        home_lineup_id: "",
        away_lineup_id: "",
        current_period: "pre_game" as const,
        game_status: "pre_game" as const,
        started_by_user_id: "",
        notes: "",
        status: "active" as const,
      };

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Fixture ID is required");
    });

    it("should fail when organization ID is missing", async () => {
      const input = {
        organization_id: "",
        fixture_id: "fixture-001",
        home_lineup_id: "",
        away_lineup_id: "",
        current_period: "pre_game" as const,
        game_status: "pre_game" as const,
        started_by_user_id: "",
        notes: "",
        status: "active" as const,
      };

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Organization ID is required");
    });

    it("should fail when a live game log already exists for fixture", async () => {
      const input = {
        organization_id: "org-001",
        fixture_id: "fixture-001",
        home_lineup_id: "",
        away_lineup_id: "",
        current_period: "pre_game" as const,
        game_status: "pre_game" as const,
        started_by_user_id: "",
        notes: "",
        status: "active" as const,
      };

      vi.mocked(
        mock_repository.get_live_game_log_for_fixture,
      ).mockResolvedValue({
        success: true,
        data: create_mock_live_game_log(),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        "A live game log already exists for this fixture",
      );
    });
  });

  describe("delete", () => {
    it("should delete a pre-game log successfully", async () => {
      const existing_log = create_mock_live_game_log({
        game_status: "pre_game",
      });

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_log,
      });

      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("livegame-001");

      expect(result.success).toBe(true);
    });

    it("should fail to delete an in-progress game", async () => {
      const existing_log = create_mock_live_game_log({
        game_status: "in_progress",
      });

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_log,
      });

      const result = await use_cases.delete("livegame-001");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Cannot delete an in-progress game");
    });
  });
});
