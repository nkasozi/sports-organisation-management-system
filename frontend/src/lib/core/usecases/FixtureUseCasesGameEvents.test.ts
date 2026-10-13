import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameEvent } from "../entities/Fixture";
import { create_score_award_resolver } from "../entities/SportEventCatalog";
import type { FixtureRepository } from "../interfaces/ports";
import { create_fixture_use_cases } from "./FixtureUseCases";
import {
  create_mock_repository,
  create_test_fixture,
} from "./FixtureUseCases.test_support";

const LEGACY_SCORING = create_score_award_resolver([]);

describe("FixtureUseCases", () => {
  let mock_repository: FixtureRepository;
  let use_cases: ReturnType<typeof create_fixture_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_fixture_use_cases(mock_repository);
  });

  describe("record_game_event", () => {
    it("should record goal event and update score", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture({
          status: "in_progress",
          home_team_score: 0,
          away_team_score: 0,
          game_events: [],
        }),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ home_team_score: 1 }),
      });

      const event = {
        id: "event-1",
        event_type: "goal",
        minute: 25,
        stoppage_time_minute: 0,
        team_side: "home",
        player_name: "Player 1",
        secondary_player_name: "",
        description: "",
        recorded_at: new Date().toISOString(),
      } as GameEvent;

      const result = await use_cases.record_game_event(
        "fixture-123",
        event,
        LEGACY_SCORING(event.event_type),
      );

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "fixture-123",
        expect.objectContaining({
          home_team_score: 1,
        }),
      );
    });

    it("should record own goal and credit opponent", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture({
          status: "in_progress",
          home_team_score: 0,
          away_team_score: 0,
          game_events: [],
        }),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ away_team_score: 1 }),
      });

      const event = {
        id: "event-2",
        event_type: "own_goal",
        minute: 30,
        stoppage_time_minute: 0,
        team_side: "home",
        player_name: "Player 1",
        secondary_player_name: "",
        description: "",
        recorded_at: new Date().toISOString(),
      } as GameEvent;

      const result = await use_cases.record_game_event(
        "fixture-123",
        event,
        LEGACY_SCORING(event.event_type),
      );

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "fixture-123",
        expect.objectContaining({
          away_team_score: 1,
        }),
      );
    });

    it("should fail for empty id", async () => {
      const event = {
        id: "event-3",
        event_type: "goal",
        minute: 10,
        stoppage_time_minute: 0,
        team_side: "home",
        player_name: "Player 1",
        secondary_player_name: "",
        description: "",
        recorded_at: new Date().toISOString(),
      } as GameEvent;
      const result = await use_cases.record_game_event(
        "",
        event,
        LEGACY_SCORING(event.event_type),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("update_period", () => {
    it("should update period", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture({ status: "in_progress" }),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ current_period: "second_half" }),
      });

      const result = await use_cases.update_period(
        "fixture-123",
        "second_half",
        45,
      );

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update_period("", "second_half", 45);

      expect(result.success).toBe(false);
    });
  });
});
