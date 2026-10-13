import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameEventLogType } from "../entities/GameEventLog";
import type { GameEventLogRepository } from "../interfaces/ports";
import {
  create_game_event_log_use_cases,
  type GameEventLogUseCases,
} from "./GameEventLogUseCases";
import {
  create_mock_game_event_log,
  create_mock_repository,
} from "./GameEventLogUseCases.test_support";

const BLANK_EVENT_TYPE: string = "";

describe("GameEventLogUseCases", () => {
  let use_cases: GameEventLogUseCases;
  let mock_repository: GameEventLogRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_game_event_log_use_cases(mock_repository);
  });

  describe("create", () => {
    it("should create a game event log successfully", async () => {
      const input = {
        organization_id: "org-001",
        live_game_log_id: "livegame-001",
        fixture_id: "fixture-001",
        event_type: "goal" as const,
        minute: 25,
        stoppage_time_minute: 0,
        team_side: "home" as const,
        player_id: "player-001",
        player_name: "John Doe",
        secondary_player_id: "",
        secondary_player_name: "",
        description: "Goal by John Doe",
        affects_score: true,
        score_change_home: 1,
        score_change_away: 0,
        recorded_by_user_id: "user-001",
        status: "active" as const,
      };

      const created_event = create_mock_game_event_log(input);

      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_event,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toEqual(created_event);
    });

    it("should fail when live_game_log_id is missing", async () => {
      const input = {
        organization_id: "org-001",
        live_game_log_id: "",
        fixture_id: "fixture-001",
        event_type: "goal" as const,
        minute: 25,
        stoppage_time_minute: 0,
        team_side: "home" as const,
        player_id: "",
        player_name: "",
        secondary_player_id: "",
        secondary_player_name: "",
        description: "",
        affects_score: false,
        score_change_home: 0,
        score_change_away: 0,
        recorded_by_user_id: "",
        status: "active" as const,
      };

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Live game log ID is required");
    });

    it("should fail when event_type is missing", async () => {
      const input = {
        organization_id: "org-001",
        live_game_log_id: "livegame-001",
        fixture_id: "fixture-001",
        event_type: BLANK_EVENT_TYPE as GameEventLogType,
        minute: 25,
        stoppage_time_minute: 0,
        team_side: "home" as const,
        player_id: "",
        player_name: "",
        secondary_player_id: "",
        secondary_player_name: "",
        description: "",
        affects_score: false,
        score_change_home: 0,
        score_change_away: 0,
        recorded_by_user_id: "",
        status: "active" as const,
      };

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Event type is required");
    });
  });
});
