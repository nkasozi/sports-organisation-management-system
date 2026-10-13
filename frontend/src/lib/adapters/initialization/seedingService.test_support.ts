import { vi } from "vitest";

import type {
  RepositoryModuleBuilders,
  SeedingServiceMocks,
  SeedingStateMocks,
} from "./seedingServiceMockTypes.test_support";
import {
  create_container_module,
  create_current_user_module,
  create_event_bus_module,
  create_organization_defaults_seeder_module,
  create_seed_data_generator_module,
  create_system_user_repository_module,
} from "./seedingServiceModules.test_support";
import {
  create_empty_repo,
  create_listing_repository,
  create_updatable_listing_repository,
} from "./seedingServiceRepositoryMocks.test_support";

export type ConvexSeedResult = {
  success: boolean;
  data_source: "convex" | "local" | "none";
  tables_fetched: number;
  total_records: number;
  failed_tables: string[];
};

type SeedRecord = Record<string, unknown>;

export function create_failed_convex_seed_result(): ConvexSeedResult {
  return {
    success: false,
    data_source: "none",
    tables_fetched: 0,
    total_records: 0,
    failed_tables: [],
  };
}

function to_repository_getter_name(entity_name: string): string {
  const snake_name = entity_name.replace(
    /[A-Z]/g,
    (letter: string, offset: number) =>
      `${offset === 0 ? "" : "_"}${letter.toLowerCase()}`,
  );
  return `get_${snake_name}_repository`;
}

function create_repository_module_builders(
  mock_fixture_repository: object,
  mock_competition_stage_repository: object,
  mock_competition_format_repository: object,
): RepositoryModuleBuilders {
  return {
    getter_only_repository_module: (entity_name: string) => ({
      [to_repository_getter_name(entity_name)]: create_empty_repo,
    }),
    repository_module: (entity_name: string) => ({
      [to_repository_getter_name(entity_name)]: create_empty_repo,
      [`InBrowser${entity_name}Repository`]: vi.fn(),
    }),
    fixture_repository_module: () => ({
      get_fixture_repository: () => mock_fixture_repository,
      InBrowserFixtureRepository: vi.fn(),
    }),
    competition_stage_repository_module: () => ({
      get_competition_stage_repository: () => mock_competition_stage_repository,
      InBrowserCompetitionStageRepository: vi.fn(),
    }),
    competition_format_repository_module: () => ({
      get_competition_format_repository: () =>
        mock_competition_format_repository,
    }),
  };
}

function create_seeding_state(
  read_convex_seed_result: () => ConvexSeedResult,
): SeedingStateMocks {
  const mock_competition_formats = [] as SeedRecord[];
  const mock_fixtures = [] as SeedRecord[];
  const mock_competition_stages = [] as SeedRecord[];
  return {
    mock_try_seed_all_tables_from_convex: vi
      .fn()
      .mockImplementation(async () => read_convex_seed_result()),
    mock_app_settings_store: {} as Record<string, string>,
    mock_system_user_seed_with_data: vi
      .fn()
      .mockResolvedValue({ success: true, data: 0 }),
    mock_competition_formats,
    mock_fixtures,
    mock_competition_stages,
    mock_fixture_repository: create_updatable_listing_repository(mock_fixtures),
    mock_competition_stage_repository: create_listing_repository(
      mock_competition_stages,
    ),
    mock_competition_format_repository: create_updatable_listing_repository(
      mock_competition_formats,
    ),
  };
}

export function create_seeding_service_mocks(
  read_convex_seed_result: () => ConvexSeedResult,
): SeedingServiceMocks {
  const state = create_seeding_state(read_convex_seed_result);
  return {
    ...state,
    ...create_repository_module_builders(
      state.mock_fixture_repository,
      state.mock_competition_stage_repository,
      state.mock_competition_format_repository,
    ),
    convex_seeding_module: () => ({
      try_seed_all_tables_from_convex:
        state.mock_try_seed_all_tables_from_convex,
    }),
    container_module: () =>
      create_container_module(state.mock_app_settings_store),
    system_user_repository_module: () =>
      create_system_user_repository_module(
        state.mock_system_user_seed_with_data,
      ),
    organization_defaults_seeder_module:
      create_organization_defaults_seeder_module,
    seed_data_generator_module: create_seed_data_generator_module,
    event_bus_module: create_event_bus_module,
    current_user_module: create_current_user_module,
  };
}

export function reset_seeding_service_mocks(
  mocks: SeedingServiceMocks,
): boolean {
  mocks.mock_competition_formats.splice(
    0,
    mocks.mock_competition_formats.length,
  );
  mocks.mock_competition_format_repository.find_all.mockClear();
  mocks.mock_competition_format_repository.update.mockClear();
  mocks.mock_fixtures.splice(0, mocks.mock_fixtures.length);
  mocks.mock_fixture_repository.find_all.mockClear();
  mocks.mock_fixture_repository.update.mockClear();
  mocks.mock_competition_stages.splice(0, mocks.mock_competition_stages.length);
  mocks.mock_competition_stage_repository.find_all.mockClear();
  mocks.mock_try_seed_all_tables_from_convex.mockClear();
  return true;
}
