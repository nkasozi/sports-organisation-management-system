import type { Mock } from "vitest";

export type MockModule = Record<string, unknown>;

export interface ListingRepositoryMock {
  seed_with_data: Mock;
  find_all: Mock;
  with_write_origin(): ListingRepositoryMock;
}

export interface UpdatableListingRepositoryMock extends ListingRepositoryMock {
  update: Mock;
}

export interface EmptyRepositoryMock extends UpdatableListingRepositoryMock {
  find_all_with_filter: Mock;
}

export interface RepositoryModuleBuilders {
  getter_only_repository_module(entity_name: string): MockModule;
  repository_module(entity_name: string): MockModule;
  fixture_repository_module(): MockModule;
  competition_stage_repository_module(): MockModule;
  competition_format_repository_module(): MockModule;
}

export interface SeedingStateMocks {
  mock_try_seed_all_tables_from_convex: Mock;
  mock_app_settings_store: Record<string, string>;
  mock_system_user_seed_with_data: Mock;
  mock_competition_formats: Record<string, unknown>[];
  mock_fixtures: Record<string, unknown>[];
  mock_competition_stages: Record<string, unknown>[];
  mock_fixture_repository: UpdatableListingRepositoryMock;
  mock_competition_stage_repository: ListingRepositoryMock;
  mock_competition_format_repository: UpdatableListingRepositoryMock;
}

export interface SeedingServiceMocks
  extends SeedingStateMocks, RepositoryModuleBuilders {
  convex_seeding_module(): MockModule;
  container_module(): MockModule;
  system_user_repository_module(): MockModule;
  organization_defaults_seeder_module(): MockModule;
  seed_data_generator_module(): MockModule;
  event_bus_module(): MockModule;
  current_user_module(): MockModule;
}
