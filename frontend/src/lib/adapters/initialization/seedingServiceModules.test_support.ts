import { type Mock, vi } from "vitest";

import type { MockModule } from "./seedingServiceMockTypes.test_support";

const SEED_ADMIN_USER = {
  id: "admin-1",
  email: "admin@test.com",
  first_name: "Admin",
  last_name: "User",
  organization_id: "org-1",
  role: "super_admin",
};

const SEED_VENUES = [
  { id: "venue-dragon-stadium", name: "Dragon Stadium" },
  { id: "venue-thunder-arena", name: "Thunder Arena" },
  { id: "venue-eagle-nest", name: "Eagle Nest" },
  { id: "venue-storm-center", name: "Storm Center" },
  {
    id: "venue-international-hockey-arena",
    name: "International Hockey Arena",
  },
];

const EMPTY_SEED_GENERATOR_NAMES = [
  "create_seed_players",
  "create_seed_teams",
  "create_seed_team_staff",
  "create_seed_competitions",
  "create_seed_competition_stages",
  "create_seed_competition_teams",
  "create_seed_player_team_memberships",
  "create_seed_officials",
  "create_seed_fixtures",
  "create_seed_fixture_lineups",
  "create_seed_jersey_colors",
  "create_seed_player_profiles",
  "create_seed_profile_links",
  "create_seed_team_profiles",
  "create_seed_team_profile_links",
  "create_seed_genders",
  "create_seed_identification_types",
];

function create_app_settings_storage(
  store: Record<string, string>,
): MockModule {
  return {
    get_setting: (key: string) => Promise.resolve(store[key] ?? ""),
    set_setting: (key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    },
    remove_setting: (key: string) => {
      delete store[key];
      return Promise.resolve();
    },
    clear_all_settings: () => {
      Object.keys(store).forEach((k) => delete store[k]);
      return Promise.resolve();
    },
  };
}

export function create_container_module(
  store: Record<string, string>,
): MockModule {
  return {
    get_repository_container: () => ({
      system_user_repository: {
        find_by_id: vi.fn().mockResolvedValue({
          success: true,
          data: { ...SEED_ADMIN_USER },
        }),
        find_all: vi.fn().mockResolvedValue({
          success: true,
          data: { items: [] },
        }),
      },
    }),
    get_app_settings_storage: () => create_app_settings_storage(store),
  };
}

export function create_system_user_repository_module(
  seed_with_data: Mock,
): MockModule {
  return {
    get_system_user_repository: () => {
      const repository = {
        seed_with_data,
        find_by_id: vi.fn().mockResolvedValue({
          success: true,
          data: { ...SEED_ADMIN_USER },
        }),
        with_write_origin: () => repository,
      };
      return repository;
    },
  };
}

export function create_organization_defaults_seeder_module(): MockModule {
  return {
    seed_default_lookup_entities_with_origin: vi.fn().mockResolvedValue({
      success: true,
      data: {
        organization_id: "test",
        genders_seeded: 2,
        identification_types_seeded: 2,
        player_positions_seeded: 2,
        game_official_roles_seeded: 2,
        game_event_types_seeded: 2,
        team_staff_roles_seeded: 2,
      },
    }),
  };
}

export function create_seed_data_generator_module(): MockModule {
  return {
    ...Object.fromEntries(
      EMPTY_SEED_GENERATOR_NAMES.map((name: string) => [
        name,
        vi.fn().mockReturnValue([]),
      ]),
    ),
    create_seed_venues: vi
      .fn()
      .mockImplementation((organization_id: string) =>
        SEED_VENUES.map((venue) => ({ ...venue, organization_id })),
      ),
    create_seed_system_users: vi.fn().mockReturnValue([{ ...SEED_ADMIN_USER }]),
    SEED_ORGANIZATION_IDS: { UGANDA_HOCKEY_ASSOCIATION: "org-1" },
    SEED_SYSTEM_USER_IDS: { SYSTEM_ADMINISTRATOR: "admin-1" },
  };
}

export function create_event_bus_module(): MockModule {
  return {
    EventBus: {
      emit_entity_created: vi.fn(),
    },
    set_user_context: vi.fn(),
    clear_user_context: vi.fn(),
  };
}

export function create_current_user_module(): MockModule {
  return {
    current_user_store: {
      set_user: vi.fn().mockImplementation(async () => {}),
    },
  };
}
