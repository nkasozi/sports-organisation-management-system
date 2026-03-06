import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  create_live_game_log_use_cases,
  type LiveGameLogUseCases,
} from "./LiveGameLogUseCases";
import type { LiveGameLogRepository } from "../interfaces/ports";
import type { LiveGameLog } from "../entities/LiveGameLog";

function create_mock_live_game_log(
  overrides: Partial<LiveGameLog> = {},
): LiveGameLog {
  return {
    id: "livegame-001",
    organization_id: "org-001",
    fixture_id: "fixture-001",
    home_lineup_id: "lineup-home-001",
    away_lineup_id: "lineup-away-001",
    current_period: "pre_game",
    current_minute: 0,
    stoppage_time_minutes: 0,
    clock_running: false,
    clock_paused_at_seconds: 0,
    home_team_score: 0,
    away_team_score: 0,
    game_status: "pre_game",
    started_at: "",
    ended_at: "",
    started_by_user_id: "",
    ended_by_user_id: "",
    notes: "",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function create_mock_repository(): LiveGameLogRepository {
  return {
    create: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    find_all: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    get_live_game_log_for_fixture: vi.fn(),
    get_active_games: vi.fn(),
    find_by_organization: vi.fn(),
    find_completed_games: vi.fn(),
  };
}

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
