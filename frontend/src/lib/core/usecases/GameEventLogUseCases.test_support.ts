import { vi } from "vitest";

import type { GameEventLog } from "../entities/GameEventLog";
import type { GameEventLogRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_game_event_log(
  overrides: Partial<ScalarInput<GameEventLog>> = {},
): GameEventLog {
  return {
    id: "event-001",
    organization_id: "org-001",
    live_game_log_id: "livegame-001",
    fixture_id: "fixture-001",
    event_type: "goal",
    minute: 25,
    stoppage_time_minute: 0,
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
  } as unknown as GameEventLog;
}

export function create_mock_repository(): GameEventLogRepository {
  return {
    create: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    find_all: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    get_events_for_live_game: vi.fn(),
    get_events_for_fixture: vi.fn(),
    get_events_for_player: vi.fn(),
    get_scoring_events_for_live_game: vi.fn(),
    get_card_events_for_live_game: vi.fn(),
    void_event: vi.fn(),
  } as GameEventLogRepository;
}
