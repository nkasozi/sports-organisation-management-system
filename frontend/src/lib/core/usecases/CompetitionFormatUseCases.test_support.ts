import { vi } from "vitest";

import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
} from "../entities/CompetitionFormat";
import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "../entities/CompetitionFormatFactories";
import type { CompetitionFormatRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): CompetitionFormatRepository {
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

export function create_test_format(
  overrides: Partial<ScalarInput<CompetitionFormat>> = {},
): CompetitionFormat {
  return {
    id: "format-123",
    name: "Round Robin",
    code: "RR",
    description: "Each team plays every other team",
    format_type: "round_robin",
    tie_breakers: ["goal_difference"],
    group_stage_config: create_default_group_stage_config(),
    knockout_stage_config: create_default_knockout_stage_config(),
    league_config: { ...create_default_league_config(), number_of_rounds: 1 },
    points_config: {
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
    },
    min_teams_required: 2,
    max_teams_allowed: 20,
    stage_templates: [],
    status: "active",
    organization_id: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as CompetitionFormat;
}

export function create_valid_input(
  overrides: Partial<CreateCompetitionFormatInput> = {},
): CreateCompetitionFormatInput {
  return {
    name: "Knockout",
    code: "KO",
    description: "Single elimination tournament",
    format_type: "straight_knockout",
    tie_breakers: ["goal_difference"],
    group_stage_config: create_default_group_stage_config(),
    knockout_stage_config: {
      ...create_default_knockout_stage_config(),
      third_place_match: false,
    },
    league_config: create_default_league_config(),
    points_config: {
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
    },
    min_teams_required: 4,
    max_teams_allowed: 64,
    stage_templates: [],
    status: "active",
    organization_id: "",
    ...overrides,
  } as CreateCompetitionFormatInput;
}
