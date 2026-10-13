import { vi } from "vitest";

import type { CreateSportInput, Sport } from "../entities/Sport";
import { create_default_penalties_config } from "../entities/SportDefaults";
import type { SportRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): SportRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  } as SportRepository;
}

export function create_test_sport(
  overrides: Partial<ScalarInput<Sport>> = {},
): Sport {
  return {
    id: "sport-123",
    name: "Football",
    code: "FB",
    description: "Association football",
    icon_url: "",
    standard_game_duration_minutes: 90,
    periods: [],
    card_types: [],
    foul_categories: [],
    official_requirements: [],
    overtime_rules: {
      is_enabled: false,
      trigger_condition: "never",
      overtime_type: "extra_time",
      extra_time_periods: [],
      penalties_config: create_default_penalties_config(),
    },
    scoring_rules: [],
    substitution_rules: {
      max_substitutions_per_game: 3,
      max_substitution_windows: -1,
      rolling_substitutions_allowed: false,
      return_after_substitution_allowed: false,
    },
    max_players_on_field: 11,
    min_players_on_field: 7,
    max_squad_size: 18,
    min_players_per_fixture: 7,
    max_players_per_fixture: 18,
    additional_rules: {},
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Sport;
}

export function create_valid_input(
  overrides: Partial<CreateSportInput> = {},
): CreateSportInput {
  return {
    name: "Basketball",
    code: "BB",
    description: "Team sport",
    icon_url: "",
    standard_game_duration_minutes: 48,
    periods: [],
    card_types: [],
    foul_categories: [],
    official_requirements: [],
    overtime_rules: {
      is_enabled: false,
      trigger_condition: "never",
      overtime_type: "extra_time",
      extra_time_periods: [],
      penalties_config: create_default_penalties_config(),
    },
    scoring_rules: [],
    substitution_rules: {
      max_substitutions_per_game: 12,
      max_substitution_windows: -1,
      rolling_substitutions_allowed: true,
      return_after_substitution_allowed: true,
    },
    max_players_on_field: 5,
    min_players_on_field: 5,
    max_squad_size: 12,
    min_players_per_fixture: 5,
    max_players_per_fixture: 12,
    additional_rules: {},
    status: "active",
    ...overrides,
  } as CreateSportInput;
}
