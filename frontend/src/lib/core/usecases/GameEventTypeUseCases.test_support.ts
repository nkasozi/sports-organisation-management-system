import { vi } from "vitest";

import type {
  CreateGameEventTypeInput,
  GameEventType,
} from "../entities/GameEventType";
import type { GameEventTypeRepository } from "../interfaces/ports";

export function create_mock_repository(): GameEventTypeRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_sport: vi.fn(),
    find_by_category: vi.fn(),
    find_by_code: vi.fn(),
    find_scoring_events: vi.fn(),
    find_by_organization: vi.fn(),
  } as GameEventTypeRepository;
}

export function create_test_event_type(
  overrides: Partial<GameEventType> = {},
): GameEventType {
  return {
    id: "event-type-123",
    name: "Goal",
    code: "GOAL",
    description: "A goal scored",
    icon: "⚽",
    color: "bg-green-500",
    category: "score",
    affects_score: true,
    requires_player: true,
    display_order: 1,
    sport_id: "sport-123",
    status: "active",
    organization_id: "test-org-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as GameEventType;
}

export function create_valid_input(
  overrides: Partial<CreateGameEventTypeInput> = {},
): CreateGameEventTypeInput {
  return {
    name: "Yellow Card",
    code: "YELLOW",
    description: "Caution",
    icon: "🟨",
    color: "bg-yellow-500",
    category: "discipline",
    affects_score: false,
    requires_player: true,
    display_order: 2,
    sport_id: "sport-123",
    status: "active",
    organization_id: "test-org-1",
    ...overrides,
  } as CreateGameEventTypeInput;
}
