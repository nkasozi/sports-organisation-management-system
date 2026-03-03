import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  create_game_event_log_use_cases,
  type GameEventLogUseCases,
} from "./GameEventLogUseCases";
import type { GameEventLogRepository } from "../interfaces/ports";
import type { GameEventLog } from "../entities/GameEventLog";

function create_mock_game_event_log(
  overrides: Partial<GameEventLog> = {},
): GameEventLog {
  return {
    id: "event-001",
    organization_id: "org-001",
    live_game_log_id: "livegame-001",
    fixture_id: "fixture-001",
    event_type: "goal",
    minute: 25,
    stoppage_time_minute: null,
    team_side: "home",
    player_id: "player-001",
    player_name: "John Doe",
    secondary_player_id: "",
    secondary_player_name: "",
    description: "Goal by John Doe",
    affects_score: true,
    score_change_home: 1,
    score_change_away: 0,
    recorded_by_user_id: "user-001",
    recorded_at: new Date().toISOString(),
    reviewed: false,
    reviewed_by_user_id: "",
    reviewed_at: "",
    voided: false,
    voided_reason: "",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function create_mock_repository(): GameEventLogRepository {
  return {
    create_game_event_log: vi.fn(),
    get_game_event_log_by_id: vi.fn(),
    update_game_event_log: vi.fn(),
    delete_game_event_log: vi.fn(),
    find_by_filter: vi.fn(),
    get_events_for_live_game: vi.fn(),
    get_events_for_fixture: vi.fn(),
    get_events_for_player: vi.fn(),
    get_scoring_events_for_live_game: vi.fn(),
    get_card_events_for_live_game: vi.fn(),
    void_event: vi.fn(),
  };
}

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
        stoppage_time_minute: null,
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

      vi.mocked(mock_repository.create_game_event_log).mockResolvedValue({
        success: true,
        data: created_event,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created_event);
    });

    it("should fail when live_game_log_id is missing", async () => {
      const input = {
        organization_id: "org-001",
        live_game_log_id: "",
        fixture_id: "fixture-001",
        event_type: "goal" as const,
        minute: 25,
        stoppage_time_minute: null,
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
      expect(result.error_message).toBe("Live game log ID is required");
    });

    it("should fail when event_type is missing", async () => {
      const input = {
        organization_id: "org-001",
        live_game_log_id: "livegame-001",
        fixture_id: "fixture-001",
        event_type: "" as any,
        minute: 25,
        stoppage_time_minute: null,
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
      expect(result.error_message).toBe("Event type is required");
    });
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

      vi.mocked(mock_repository.create_game_event_log).mockResolvedValue({
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
      expect(mock_repository.create_game_event_log).toHaveBeenCalledWith(
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

      vi.mocked(mock_repository.create_game_event_log).mockResolvedValue({
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
      expect(mock_repository.create_game_event_log).toHaveBeenCalledWith(
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

      vi.mocked(mock_repository.create_game_event_log).mockResolvedValue({
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
      expect(mock_repository.create_game_event_log).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "substitution",
          player_id: "player-out-001",
          secondary_player_id: "player-in-001",
        }),
      );
    });
  });

  describe("void_event", () => {
    it("should void an event successfully", async () => {
      const existing_event = create_mock_game_event_log({ voided: false });

      vi.mocked(mock_repository.get_game_event_log_by_id).mockResolvedValue({
        success: true,
        data: existing_event,
      });

      const voided_event = { ...existing_event, voided: true };
      vi.mocked(mock_repository.void_event).mockResolvedValue({
        success: true,
        data: voided_event,
      });

      const result = await use_cases.void_event(
        "event-001",
        "Recorded in error",
        "user-001",
      );

      expect(result.success).toBe(true);
      expect(mock_repository.void_event).toHaveBeenCalledWith(
        "event-001",
        "Recorded in error",
        "user-001",
      );
    });

    it("should fail to void an already voided event", async () => {
      const existing_event = create_mock_game_event_log({ voided: true });

      vi.mocked(mock_repository.get_game_event_log_by_id).mockResolvedValue({
        success: true,
        data: existing_event,
      });

      const result = await use_cases.void_event(
        "event-001",
        "Recorded in error",
        "user-001",
      );

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Event is already voided");
    });

    it("should fail without a reason", async () => {
      const result = await use_cases.void_event("event-001", "", "user-001");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Void reason is required");
    });
  });

  describe("update", () => {
    it("should fail to update a voided event", async () => {
      const existing_event = create_mock_game_event_log({ voided: true });

      vi.mocked(mock_repository.get_game_event_log_by_id).mockResolvedValue({
        success: true,
        data: existing_event,
      });

      const result = await use_cases.update("event-001", { minute: 30 });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Cannot update a voided event");
    });
  });
});
