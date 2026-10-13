import { vi } from "vitest";

import type { LiveGameLog } from "../entities/LiveGameLog";
import type { LiveGameLogRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import { create_success_result, type Result } from "../types/Result";

export function create_mock_live_game_log(
  overrides: Partial<ScalarInput<LiveGameLog>> = {},
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
  } as unknown as LiveGameLog;
}

export function create_mock_repository(): LiveGameLogRepository {
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
  } as LiveGameLogRepository;
}

export const MISSING_LIVE_GAME_RESULT: Result<LiveGameLog> = {
  success: false,
  error: "missing",
};

export function create_echoing_repository(
  existing: Result<LiveGameLog>,
): LiveGameLogRepository {
  const repository = create_mock_repository();
  vi.mocked(repository.find_by_id).mockResolvedValue(existing);
  vi.mocked(repository.update).mockImplementation(async (id, updates) =>
    create_success_result(
      create_mock_live_game_log({
        ...(existing.success ? existing.data : {}),
        ...updates,
        id,
      }),
    ),
  );
  return repository;
}
