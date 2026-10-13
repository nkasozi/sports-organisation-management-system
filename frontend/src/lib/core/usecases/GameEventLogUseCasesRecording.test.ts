import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameEventLogRepository } from "../interfaces/ports";
import {
  create_game_event_log_use_cases,
  type GameEventLogUseCases,
} from "./GameEventLogUseCases";
import {
  create_mock_game_event_log,
  create_mock_repository,
} from "./GameEventLogUseCases.test_support";

describe("GameEventLogUseCases", () => {
  let use_cases: GameEventLogUseCases;
  let mock_repository: GameEventLogRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_game_event_log_use_cases(mock_repository);
  });

  describe("record_goal", () => {
    it("should record a goal successfully", async () => {
      const created_event = create_mock_game_event_log({
        event_type: "goal",
        team_side: "home",
        affects_score: true,
        score_change_home: 1,
        score_change_away: 0,
      });

      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_event,
      });

      const result = await use_cases.record_goal(
        "livegame-001",
        "fixture-001",
        "org-001",
        25,
        "home",
        "player-001",
        "John Doe",
        "user-001",
      );

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "goal",
          team_side: "home",
          affects_score: true,
          score_change_home: 1,
          score_change_away: 0,
        }),
      );
    });
  });

  describe("record_card", () => {
    it("should record a yellow card successfully", async () => {
      const created_event = create_mock_game_event_log({
        event_type: "yellow_card",
        affects_score: false,
      });

      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_event,
      });

      const result = await use_cases.record_card(
        "livegame-001",
        "fixture-001",
        "org-001",
        30,
        "away",
        "player-002",
        "Jane Doe",
        "yellow_card",
        "user-001",
      );

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "yellow_card",
          affects_score: false,
        }),
      );
    });
  });

  describe("record_substitution", () => {
    it("should record a substitution successfully", async () => {
      const created_event = create_mock_game_event_log({
        event_type: "substitution",
        player_name: "Player Out",
        secondary_player_name: "Player In",
      });

      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_event,
      });

      const result = await use_cases.record_substitution(
        "livegame-001",
        "fixture-001",
        "org-001",
        60,
        "home",
        "player-out-001",
        "Player Out",
        "player-in-001",
        "Player In",
        "user-001",
      );

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "substitution",
          player_id: "player-out-001",
          secondary_player_id: "player-in-001",
        }),
      );
    });
  });
});
