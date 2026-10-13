import { vi } from "vitest";

import type { CompetitionFormat } from "../entities/CompetitionFormat";
import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "../entities/CompetitionFormatFactories";
import type { CompetitionStage } from "../entities/CompetitionStage";
import type { CompetitionFormatRepository } from "../interfaces/ports";
import type { CompetitionStageRepository } from "../interfaces/ports";
import type { FixtureRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_format_repository(): CompetitionFormatRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_format_type: vi.fn(),
    find_by_code: vi.fn(),
    find_active_formats: vi.fn(),
    find_by_organization: vi.fn(),
  } as CompetitionFormatRepository;
}

export function create_mock_stage_repository(): CompetitionStageRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_competition: vi.fn(),
  } as CompetitionStageRepository;
}

export function create_mock_fixture_repository(): FixtureRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    create_many: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_competition: vi.fn(),
    find_by_team: vi.fn(),
    find_by_round: vi.fn(),
    find_upcoming: vi.fn(),
    find_by_date_range: vi.fn(),
  } as FixtureRepository;
}

export function create_test_format(
  overrides: Partial<ScalarInput<CompetitionFormat>> = {},
): CompetitionFormat {
  return {
    id: "format-123",
    name: "League",
    code: "league",
    description: "League format",
    format_type: "league",
    tie_breakers: ["goal_difference"],
    group_stage_config: create_default_group_stage_config(),
    knockout_stage_config: create_default_knockout_stage_config(),
    league_config: { ...create_default_league_config(), number_of_rounds: 2 },
    points_config: {
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
    },
    stage_templates: [
      { name: "Round 1", stage_type: "league_stage", stage_order: 1 },
      { name: "Round 2", stage_type: "league_stage", stage_order: 2 },
    ],
    min_teams_required: 2,
    max_teams_allowed: 20,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as CompetitionFormat;
}

export function create_test_stage(
  overrides: Partial<ScalarInput<CompetitionStage>> = {},
): CompetitionStage {
  return {
    id: "stage-1",
    competition_id: "comp-123",
    name: "Round 1",
    stage_type: "league_stage",
    stage_order: 1,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as CompetitionStage;
}
