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

  describe("start_game", () => {
    it("should start a pre-game successfully", async () => {
      const existing_log = create_mock_live_game_log({
        game_status: "pre_game",
      });

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_log,
      });

      const updated_log = {
        ...existing_log,
        game_status: "in_progress" as const,
        clock_running: true,
        current_period: "first_half" as const,
      };

      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: updated_log,
      });

      const result = await use_cases.start_game("livegame-001", "user-001");

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "livegame-001",
        expect.objectContaining({
          game_status: "in_progress",
          clock_running: true,
        }),
      );
    });

    it("should fail to start a completed game", async () => {
      const existing_log = create_mock_live_game_log({
        game_status: "completed",
      });

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_log,
      });

      const result = await use_cases.start_game("livegame-001", "user-001");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Cannot start a game that is");
    });
  });

  describe("end_game", () => {
    it("should end an in-progress game successfully", async () => {
      const existing_log = create_mock_live_game_log({
        game_status: "in_progress",
      });

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_log,
      });

      const updated_log = {
        ...existing_log,
        game_status: "completed" as const,
        clock_running: false,
      };

      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: updated_log,
      });

      const result = await use_cases.end_game("livegame-001", "user-001");

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "livegame-001",
        expect.objectContaining({
          game_status: "completed",
          clock_running: false,
          ended_by_user_id: "user-001",
        }),
      );
    });
  });

  describe("update_score", () => {
    it("should update scores successfully", async () => {
      const existing_log = create_mock_live_game_log();

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_log,
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: { ...existing_log, home_team_score: 2, away_team_score: 1 },
      });

      const result = await use_cases.update_score("livegame-001", 2, 1);

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith("livegame-001", {
        home_team_score: 2,
        away_team_score: 1,
      });
    });

    it("should reject negative scores", async () => {
      const result = await use_cases.update_score("livegame-001", -1, 0);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Scores cannot be negative");
    });
  });
});
