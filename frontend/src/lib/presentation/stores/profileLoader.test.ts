import { describe, expect, it, vi } from "vitest";

import type { SystemUser } from "$lib/core/entities/SystemUser";
import type {
  OrganizationRepository,
  SystemUserRepository,
  TeamRepository,
} from "$lib/core/interfaces/ports";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  convert_system_user_to_profile,
  convert_system_users_to_profiles,
  load_profiles_from_repository,
  resolve_organization_names,
} from "./profileLoader";

function create_test_system_user(
  overrides: Partial<ScalarInput<SystemUser>> = {},
): SystemUser {
  return {
    id: "usr_test_1",
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "org_admin",
    status: "active",
    organization_id: "org_1",
    team_id: "team_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as SystemUser;
}

function create_mock_system_user_repository(
  return_value: ReturnType<SystemUserRepository["find_all"]>,
): SystemUserRepository {
  return {
    find_active_users: vi.fn(),
    find_all: vi.fn().mockReturnValue(return_value),
    find_by_email: vi.fn(),
    find_by_role: vi.fn(),
    find_admins: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    count: vi.fn(),
    has_data: vi.fn(),
    seed_with_data: vi.fn(),
    clear_all_data: vi.fn(),
  } as unknown as SystemUserRepository;
}

function create_mock_org_repository(
  organizations: Array<{ id: string; name: string }> = [],
): OrganizationRepository {
  return {
    find_by_ids: vi.fn().mockResolvedValue(
      create_success_result(
        organizations.map((org) => ({
          id: org.id,
          name: org.name,
          description: "",
          sport_id: "",
          founded_date: "",
          contact_email: "",
          contact_phone: "",
          address: "",
          website: "",
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        })),
      ),
    ),
    find_active_organizations: vi.fn(),
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    count: vi.fn(),
    has_data: vi.fn(),
    seed_with_data: vi.fn(),
    clear_all_data: vi.fn(),
  } as unknown as OrganizationRepository;
}

function create_mock_team_repository(
  teams: Array<{ id: string; name: string }> = [],
): TeamRepository {
  return {
    find_by_ids: vi.fn().mockResolvedValue(
      create_success_result(
        teams.map((team) => ({
          id: team.id,
          name: team.name,
          short_name: team.name,
          description: "",
          organization_id: "org_1",
          gender_id: "",
          captain_player_id: "",
          vice_captain_player_id: "",
          max_squad_size: 25,
          home_venue_id: "",
          primary_color: "#000000",
          secondary_color: "#FFFFFF",
          logo_url: "",
          website: "",
          founded_year: 2024,
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        })),
      ),
    ),
    find_active_teams: vi.fn(),
    find_by_organization: vi.fn(),
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    count: vi.fn(),
    has_data: vi.fn(),
    seed_with_data: vi.fn(),
    clear_all_data: vi.fn(),
  } as unknown as TeamRepository;
}

describe("convert_system_user_to_profile", () => {
  it("maps all fields from system user to profile", () => {
    const system_user = create_test_system_user({
      id: "usr_1",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      role: "team_manager",
      organization_id: "org_99",
      team_id: "team_42",
      player_id: "player_7",
      official_id: "official_3",
    });

    const profile = convert_system_user_to_profile(
      system_user,
      "Test Organisation",
      "Test Team",
    );

    expect(profile.id).toBe("usr_1");
    expect(profile.display_name).toBe("Jane Smith");
    expect(profile.email).toBe("jane@example.com");
    expect(profile.role).toBe("team_manager");
    expect(profile.organization_id).toBe("org_99");
    expect(profile.organization_name).toBe("Test Organisation");
    expect(profile.team_id).toBe("team_42");
    expect(profile.team_name).toBe("Test Team");
    expect(profile.player_id).toBe("player_7");
    expect(profile.official_id).toBe("official_3");
  });

  it("sets team_id to empty string when system user has no team_id", () => {
    const system_user = create_test_system_user({ team_id: void 0 });

    const profile = convert_system_user_to_profile(system_user, "Org", "");

    expect(profile.team_id).toBe("");
  });

  it("concatenates first and last name for display_name", () => {
    const system_user = create_test_system_user({
      first_name: "Michael",
      last_name: "Anderson",
    });

    const profile = convert_system_user_to_profile(system_user, "Org", "");

    expect(profile.display_name).toBe("Michael Anderson");
  });
});

describe("convert_system_users_to_profiles", () => {
  it("converts multiple system users using organization name map", () => {
    const users = [
      create_test_system_user({
        id: "usr_1",
        first_name: "Alice",
        organization_id: "org_1",
        team_id: "team_1",
      }),
      create_test_system_user({
        id: "usr_2",
        first_name: "Bob",
        organization_id: "org_2",
        team_id: "team_2",
      }),
    ];

    const org_map = new Map([
      ["org_1", "Hockey Federation"],
      ["org_2", "Football League"],
    ]);
    const team_map = new Map([
      ["team_1", "Kampala Cranes"],
      ["team_2", "Entebbe Sharks"],
    ]);

    const profiles = convert_system_users_to_profiles(users, org_map, team_map);

    expect(profiles).toHaveLength(2);
    expect(profiles[0].organization_name).toBe("Hockey Federation");
    expect(profiles[0].team_name).toBe("Kampala Cranes");
    expect(profiles[1].organization_name).toBe("Football League");
    expect(profiles[1].team_name).toBe("Entebbe Sharks");
  });

  it("falls back to organization_id when name not in map", () => {
    const users = [
      create_test_system_user({
        id: "usr_1",
        organization_id: "org_unknown",
      }),
    ];

    const profiles = convert_system_users_to_profiles(
      users,
      new Map(),
      new Map(),
    );

    expect(profiles[0].organization_name).toBe("org_unknown");
    expect(profiles[0].team_name).toBe("");
  });

  it("includes all system users regardless of status", () => {
    const users = [
      create_test_system_user({ id: "usr_1", status: "active" }),
      create_test_system_user({ id: "usr_2", status: "inactive" }),
      create_test_system_user({ id: "usr_3", status: "active" }),
    ];

    const profiles = convert_system_users_to_profiles(
      users,
      new Map(),
      new Map(),
    );

    expect(profiles).toHaveLength(3);
    expect(profiles[0].id).toBe("usr_1");
    expect(profiles[1].id).toBe("usr_2");
    expect(profiles[2].id).toBe("usr_3");
  });

  it("returns empty array for empty input", () => {
    const profiles = convert_system_users_to_profiles([], new Map(), new Map());
    expect(profiles).toEqual([]);
  });
});

describe("resolve_organization_names", () => {
  it("maps wildcard to All Organisations", async () => {
    const org_repo = create_mock_org_repository();

    const name_map = await resolve_organization_names(["*"], org_repo);

    expect(name_map.get("*")).toBe("All Organisations");
    expect(org_repo.find_by_ids).not.toHaveBeenCalled();
  });

  it("resolves organization names from repository", async () => {
    const org_repo = create_mock_org_repository([
      { id: "org_1", name: "Hockey Federation" },
      { id: "org_2", name: "Football League" },
    ]);

    const name_map = await resolve_organization_names(
      ["org_1", "org_2"],
      org_repo,
    );

    expect(name_map.get("org_1")).toBe("Hockey Federation");
    expect(name_map.get("org_2")).toBe("Football League");
  });

  it("deduplicates organization ids before lookup", async () => {
    const org_repo = create_mock_org_repository([
      { id: "org_1", name: "Hockey Federation" },
    ]);

    await resolve_organization_names(["org_1", "org_1", "org_1"], org_repo);

    expect(org_repo.find_by_ids).toHaveBeenCalledWith(["org_1"]);
  });

  it("handles repository failure gracefully", async () => {
    const org_repo = create_mock_org_repository();
    vi.mocked(org_repo.find_by_ids).mockResolvedValue(
      create_failure_result("Database error"),
    );

    const name_map = await resolve_organization_names(["org_1"], org_repo);

    expect(name_map.get("*")).toBe("All Organisations");
    expect(name_map.has("org_1")).toBe(false);
  });
});

describe("load_profiles_from_repository", () => {
  it("returns profiles with resolved organization names", async () => {
    const users = [
      create_test_system_user({
        id: "usr_1",
        first_name: "Admin",
        organization_id: "org_1",
        team_id: "team_1",
      }),
      create_test_system_user({
        id: "usr_2",
        first_name: "Manager",
        organization_id: "org_2",
        team_id: "team_2",
      }),
    ];

    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(
        create_success_result({
          items: users,
          total_count: 2,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
        }),
      ),
    );

    const mock_org_repo = create_mock_org_repository([
      { id: "org_1", name: "Hockey Federation" },
      { id: "org_2", name: "Football League" },
    ]);
    const mock_team_repo = create_mock_team_repository([
      { id: "team_1", name: "Kampala Cranes" },
      { id: "team_2", name: "Entebbe Sharks" },
    ]);

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles).toHaveLength(2);
    expect(profiles[0].display_name).toBe("Admin Doe");
    expect(profiles[0].organization_name).toBe("Hockey Federation");
    expect(profiles[0].team_name).toBe("Kampala Cranes");
    expect(profiles[1].display_name).toBe("Manager Doe");
    expect(profiles[1].organization_name).toBe("Football League");
    expect(profiles[1].team_name).toBe("Entebbe Sharks");
  });

  it("returns empty array when repository call fails", async () => {
    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(create_failure_result("Database error")),
    );
    const mock_org_repo = create_mock_org_repository();
    const mock_team_repo = create_mock_team_repository();

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles).toEqual([]);
  });

  it("returns empty array when no users exist", async () => {
    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(
        create_success_result({
          items: [],
          total_count: 0,
          page_number: 1,
          page_size: 100,
          total_pages: 0,
        }),
      ),
    );
    const mock_org_repo = create_mock_org_repository();
    const mock_team_repo = create_mock_team_repository();

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles).toEqual([]);
  });

  it("preserves all user fields through conversion", async () => {
    const users = [
      create_test_system_user({
        id: "usr_player_1",
        first_name: "Denis",
        last_name: "Onyango",
        email: "denis@team.com",
        role: "player",
        organization_id: "org_hockey",
        team_id: "team_weatherhead",
        player_id: "player_99",
      }),
    ];

    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(
        create_success_result({
          items: users,
          total_count: 1,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
        }),
      ),
    );
    const mock_org_repo = create_mock_org_repository([
      { id: "org_hockey", name: "Hockey Association" },
    ]);
    const mock_team_repo = create_mock_team_repository([
      { id: "team_weatherhead", name: "Weatherhead Hockey Club" },
    ]);

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles).toHaveLength(1);
    const profile = profiles[0];
    expect(profile.id).toBe("usr_player_1");
    expect(profile.display_name).toBe("Denis Onyango");
    expect(profile.email).toBe("denis@team.com");
    expect(profile.role).toBe("player");
    expect(profile.organization_id).toBe("org_hockey");
    expect(profile.organization_name).toBe("Hockey Association");
    expect(profile.team_id).toBe("team_weatherhead");
    expect(profile.team_name).toBe("Weatherhead Hockey Club");
    expect(profile.player_id).toBe("player_99");
  });

  it("resolves wildcard organization as All Organisations", async () => {
    const users = [
      create_test_system_user({
        id: "usr_1",
        organization_id: "*",
        role: "super_admin",
      }),
    ];

    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(
        create_success_result({
          items: users,
          total_count: 1,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
        }),
      ),
    );
    const mock_org_repo = create_mock_org_repository();
    const mock_team_repo = create_mock_team_repository();

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles[0].organization_name).toBe("All Organisations");
  });
});
