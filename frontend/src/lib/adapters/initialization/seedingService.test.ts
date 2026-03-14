import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

let seeding_complete_flag = false;
let mock_convex_seed_result = {
  success: false,
  data_source: "none" as "convex" | "local" | "none",
  tables_fetched: 0,
  total_records: 0,
  failed_tables: [] as string[],
};

let seed_all_data_called = false;
let load_current_user_called = false;

vi.mock("../../infrastructure/sync/convexSeedingService", () => ({
  try_seed_all_tables_from_convex: vi.fn().mockImplementation(async () => {
    return mock_convex_seed_result;
  }),
}));

vi.mock("../../infrastructure/events/EventBus", () => ({
  EventBus: {
    emit_entity_created: vi.fn(),
  },
  set_user_context: vi.fn(),
  clear_user_context: vi.fn(),
}));

vi.mock("../../presentation/stores/currentUser", () => ({
  current_user_store: {
    set_user: vi.fn(),
  },
}));

vi.mock("../../infrastructure/container", () => ({
  get_repository_container: () => ({
    system_user_repository: {
      find_by_id: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: "admin-1",
          email: "admin@test.com",
          first_name: "Admin",
          last_name: "User",
          organization_id: "org-1",
          role: "super_admin",
        },
      }),
      find_all: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [] },
      }),
    },
  }),
}));

vi.mock("../repositories/InBrowserSystemUserRepository", () => ({
  get_system_user_repository: () => ({
    seed_with_data: vi.fn().mockResolvedValue({ success: true, data: 0 }),
    find_by_id: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: "admin-1",
        email: "admin@test.com",
        first_name: "Admin",
        last_name: "User",
        organization_id: "org-1",
        role: "super_admin",
      },
    }),
  }),
}));

const {
  create_empty_repo,
  mock_competition_formats,
  mock_competition_format_repository,
  mock_fixtures,
  mock_fixture_repository,
  mock_competition_stages,
  mock_competition_stage_repository,
} = vi.hoisted(() => {
  const mock_competition_formats: Array<Record<string, unknown>> = [];
  const mock_fixtures: Array<Record<string, unknown>> = [];
  const mock_competition_stages: Array<Record<string, unknown>> = [];

  return {
    create_empty_repo: () => ({
      seed_with_data: vi.fn().mockResolvedValue({ success: true, data: 0 }),
      find_all: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [], total_count: 0 },
      }),
      find_all_with_filter: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [], total_count: 0 },
      }),
      update: vi.fn().mockResolvedValue({ success: true, data: null }),
    }),
    mock_competition_formats,
    mock_fixtures,
    mock_fixture_repository: {
      seed_with_data: vi.fn().mockResolvedValue({ success: true, data: 0 }),
      find_all: vi.fn().mockImplementation(async () => ({
        success: true,
        data: {
          items: [...mock_fixtures],
          total_count: mock_fixtures.length,
        },
      })),
      update: vi
        .fn()
        .mockImplementation(async (id: string, updates: object) => ({
          success: true,
          data: {
            ...(mock_fixtures.find((f) => f.id === id) ?? {}),
            ...updates,
            id,
          },
        })),
    },
    mock_competition_stages,
    mock_competition_stage_repository: {
      seed_with_data: vi.fn().mockResolvedValue({ success: true, data: 0 }),
      find_all: vi.fn().mockImplementation(async () => ({
        success: true,
        data: {
          items: [...mock_competition_stages],
          total_count: mock_competition_stages.length,
        },
      })),
    },
    mock_competition_format_repository: {
      seed_with_data: vi.fn().mockResolvedValue({ success: true, data: 0 }),
      find_all: vi.fn().mockImplementation(async () => ({
        success: true,
        data: {
          items: [...mock_competition_formats],
          total_count: mock_competition_formats.length,
        },
      })),
      update: vi
        .fn()
        .mockImplementation(async (id: string, updates: object) => ({
          success: true,
          data: {
            ...(mock_competition_formats.find((format) => format.id === id) ??
              {}),
            ...updates,
            id,
          },
        })),
    },
  };
});

vi.mock("../repositories/InBrowserPlayerPositionRepository", () => ({
  get_player_position_repository: create_empty_repo,
}));
vi.mock("./organizationDefaultsSeeder", () => ({
  seed_default_lookup_entities_for_organization: vi
    .fn()
    .mockResolvedValue({ success: true, data: { organization_id: "test", genders_seeded: 2, identification_types_seeded: 2, player_positions_seeded: 2, game_official_roles_seeded: 2, game_event_types_seeded: 2, team_staff_roles_seeded: 2 } }),
}));
vi.mock("../repositories/InBrowserTeamStaffRoleRepository", () => ({
  get_team_staff_role_repository: create_empty_repo,
  InBrowserTeamStaffRoleRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserGameOfficialRoleRepository", () => ({
  get_game_official_role_repository: create_empty_repo,
  InBrowserGameOfficialRoleRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserCompetitionFormatRepository", () => ({
  get_competition_format_repository: () => mock_competition_format_repository,
}));
vi.mock("../repositories/InBrowserPlayerRepository", () => ({
  get_player_repository: create_empty_repo,
  InBrowserPlayerRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserTeamRepository", () => ({
  get_team_repository: create_empty_repo,
  InBrowserTeamRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserTeamStaffRepository", () => ({
  get_team_staff_repository: create_empty_repo,
  InBrowserTeamStaffRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserOfficialRepository", () => ({
  get_official_repository: create_empty_repo,
  InBrowserOfficialRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserCompetitionRepository", () => ({
  get_competition_repository: create_empty_repo,
  InBrowserCompetitionRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserCompetitionTeamRepository", () => ({
  get_competition_team_repository: create_empty_repo,
  InBrowserCompetitionTeamRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserPlayerTeamMembershipRepository", () => ({
  get_player_team_membership_repository: create_empty_repo,
  InBrowserPlayerTeamMembershipRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserFixtureRepository", () => ({
  get_fixture_repository: () => mock_fixture_repository,
  InBrowserFixtureRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserCompetitionStageRepository", () => ({
  get_competition_stage_repository: () => mock_competition_stage_repository,
  InBrowserCompetitionStageRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserFixtureLineupRepository", () => ({
  get_fixture_lineup_repository: create_empty_repo,
  InBrowserFixtureLineupRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserVenueRepository", () => ({
  get_venue_repository: create_empty_repo,
  InBrowserVenueRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserJerseyColorRepository", () => ({
  get_jersey_color_repository: create_empty_repo,
  InBrowserJerseyColorRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserIdentificationTypeRepository", () => ({
  get_identification_type_repository: create_empty_repo,
  InBrowserIdentificationTypeRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserGenderRepository", () => ({
  get_gender_repository: create_empty_repo,
  InBrowserGenderRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserPlayerProfileRepository", () => ({
  get_player_profile_repository: create_empty_repo,
  InBrowserPlayerProfileRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserProfileLinkRepository", () => ({
  get_profile_link_repository: create_empty_repo,
  InBrowserProfileLinkRepository: vi.fn(),
}));
vi.mock("../repositories/InBrowserTeamProfileRepository", () => ({
  get_team_profile_repository: create_empty_repo,
  InBrowserTeamProfileRepository: vi.fn(),
}));
vi.mock("../../infrastructure/utils/SeedDataGenerator", () => ({
  create_seed_players: vi.fn().mockReturnValue([]),
  create_seed_teams: vi.fn().mockReturnValue([]),
  create_seed_team_staff: vi.fn().mockReturnValue([]),
  create_seed_competitions: vi.fn().mockReturnValue([]),
  create_seed_competition_stages: vi.fn().mockReturnValue([]),
  create_seed_competition_teams: vi.fn().mockReturnValue([]),
  create_seed_player_team_memberships: vi.fn().mockReturnValue([]),
  create_seed_officials: vi.fn().mockReturnValue([]),
  create_seed_fixtures: vi.fn().mockReturnValue([]),
  create_seed_fixture_lineups: vi.fn().mockReturnValue([]),
  create_seed_venues: vi.fn().mockReturnValue([]),
  create_seed_jersey_colors: vi.fn().mockReturnValue([]),
  create_seed_player_profiles: vi.fn().mockReturnValue([]),
  create_seed_profile_links: vi.fn().mockReturnValue([]),
  create_seed_team_profiles: vi.fn().mockReturnValue([]),
  create_seed_team_profile_links: vi.fn().mockReturnValue([]),
  create_seed_system_users: vi.fn().mockReturnValue([
    {
      id: "admin-1",
      email: "admin@test.com",
      first_name: "Admin",
      last_name: "User",
      organization_id: "org-1",
      role: "super_admin",
    },
  ]),
  create_seed_genders: vi.fn().mockReturnValue([]),
  create_seed_identification_types: vi.fn().mockReturnValue([]),
  SEED_ORGANIZATION_IDS: { UGANDA_HOCKEY_ASSOCIATION: "org-1" },
  SEED_SYSTEM_USER_IDS: { SYSTEM_ADMINISTRATOR: "admin-1" },
}));

const mock_local_storage: Record<string, string> = {};

vi.stubGlobal("window", globalThis);
vi.stubGlobal("localStorage", {
  getItem: (key: string) => mock_local_storage[key] ?? null,
  setItem: (key: string, value: string) => {
    mock_local_storage[key] = value;
  },
  removeItem: (key: string) => {
    delete mock_local_storage[key];
  },
});

import {
  seed_from_convex_or_local,
  reset_seeding_flag,
} from "./seedingService";

beforeEach(() => {
  mock_competition_formats.splice(0, mock_competition_formats.length);
  mock_competition_format_repository.find_all.mockClear();
  mock_competition_format_repository.update.mockClear();
  mock_fixtures.splice(0, mock_fixtures.length);
  mock_fixture_repository.find_all.mockClear();
  mock_fixture_repository.update.mockClear();
  mock_competition_stages.splice(0, mock_competition_stages.length);
  mock_competition_stage_repository.find_all.mockClear();
});

describe("seed_from_convex_or_local — skip_seeding strategy", () => {
  let progress_messages: Array<{ message: string; percentage: number }>;
  let on_progress: (message: string, percentage: number) => void;

  beforeEach(() => {
    progress_messages = [];
    on_progress = (message: string, percentage: number) => {
      progress_messages.push({ message, percentage });
    };
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
  });

  it("returns skipped outcome without touching any data", async () => {
    const result = await seed_from_convex_or_local(on_progress, "skip_seeding");

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("skipped");
    expect(result.data_source).toBe("none");
    expect(result.error_message).toBe("");
  });

  it("does not report any progress messages", async () => {
    await seed_from_convex_or_local(on_progress, "skip_seeding");

    expect(progress_messages.length).toBe(0);
  });
});

describe("seed_from_convex_or_local — convex_first_with_local_fallback strategy", () => {
  let progress_messages: Array<{ message: string; percentage: number }>;
  let on_progress: (message: string, percentage: number) => void;

  beforeEach(() => {
    progress_messages = [];
    on_progress = (message: string, percentage: number) => {
      progress_messages.push({ message, percentage });
    };
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
    mock_convex_seed_result = {
      success: false,
      data_source: "none",
      tables_fetched: 0,
      total_records: 0,
      failed_tables: [],
    };
  });

  it("returns local_fallback_success when seeding already complete", async () => {
    mock_local_storage["sports_org_seeding_complete_v15"] = "true";

    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("local_fallback_success");
    expect(result.data_source).toBe("local");
  });

  it("repairs competition format stage fields when local seeded data already exists", async () => {
    mock_local_storage["sports_org_seeding_complete_v15"] = "true";
    mock_competition_formats.push({
      id: "format-2",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      name: "Standard League",
      code: "standard_league",
      description: "League format",
      format_type: "league",
      tie_breakers: ["goal_difference", "head_to_head", "goals_scored"],
      group_stage_config: null,
      knockout_stage_config: null,
      league_config: null,
      stage_templates: [],
      min_teams_required: 4,
      max_teams_allowed: 24,
      status: "active",
    });

    await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(mock_competition_format_repository.update).toHaveBeenCalledWith(
      "format-2",
      expect.objectContaining({
        league_config: expect.objectContaining({ number_of_rounds: 2 }),
        stage_templates: expect.arrayContaining([
          expect.objectContaining({ name: "Round 1", stage_order: 1 }),
          expect.objectContaining({ name: "Round 2", stage_order: 2 }),
        ]),
      }),
    );
  });

  it("uses convex data when convex seeding succeeds", async () => {
    mock_convex_seed_result = {
      success: true,
      data_source: "convex",
      tables_fetched: 10,
      total_records: 50,
      failed_tables: [],
    };

    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("convex_success");
    expect(result.data_source).toBe("convex");
  });

  it("marks seeding complete after successful convex seed", async () => {
    mock_convex_seed_result = {
      success: true,
      data_source: "convex",
      tables_fetched: 10,
      total_records: 50,
      failed_tables: [],
    };

    await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(mock_local_storage["sports_org_seeding_complete_v15"]).toBe("true");
  });

  it("repairs competition format stage fields after successful convex seed", async () => {
    mock_competition_formats.push({
      id: "format-1",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      name: "World Cup Style",
      code: "world_cup_style",
      description: "Groups then knockout",
      format_type: "groups_knockout",
      tie_breakers: ["goal_difference", "head_to_head", "goals_scored"],
      group_stage_config: null,
      knockout_stage_config: null,
      league_config: null,
      stage_templates: [],
      min_teams_required: 8,
      max_teams_allowed: 32,
      status: "active",
    });
    mock_convex_seed_result = {
      success: true,
      data_source: "convex",
      tables_fetched: 10,
      total_records: 50,
      failed_tables: [],
    };

    await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(mock_competition_format_repository.update).toHaveBeenCalledWith(
      "format-1",
      expect.objectContaining({
        group_stage_config: expect.objectContaining({ number_of_groups: 4 }),
        knockout_stage_config: expect.objectContaining({ number_of_rounds: 4 }),
        league_config: null,
        stage_templates: expect.arrayContaining([
          expect.objectContaining({ name: "Pool Stage", stage_order: 1 }),
          expect.objectContaining({ name: "Semi Finals", stage_order: 2 }),
          expect.objectContaining({ name: "Final", stage_order: 3 }),
        ]),
      }),
    );
  });

  it("falls back to local seeding when convex fails", async () => {
    mock_convex_seed_result = {
      success: false,
      data_source: "none",
      tables_fetched: 0,
      total_records: 0,
      failed_tables: ["organizations", "teams"],
    };

    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("local_fallback_success");
    expect(result.data_source).toBe("local");
  });

  it("reports progress with server connection message", async () => {
    mock_convex_seed_result = {
      success: true,
      data_source: "convex",
      tables_fetched: 5,
      total_records: 25,
      failed_tables: [],
    };

    await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    const connection_msg = progress_messages.find((m) =>
      m.message.includes("Connecting to server"),
    );
    expect(connection_msg).toBeDefined();
  });

  it("reports fallback progress message when convex fails", async () => {
    mock_convex_seed_result = {
      success: false,
      data_source: "none",
      tables_fetched: 0,
      total_records: 0,
      failed_tables: [],
    };

    await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    const fallback_msg = progress_messages.find((m) =>
      m.message.includes("demo data"),
    );
    expect(fallback_msg).toBeDefined();
  });
});

describe("seed_from_convex_or_local — convex_mandatory strategy", () => {
  let progress_messages: Array<{ message: string; percentage: number }>;
  let on_progress: (message: string, percentage: number) => void;

  beforeEach(() => {
    progress_messages = [];
    on_progress = (message: string, percentage: number) => {
      progress_messages.push({ message, percentage });
    };
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
    mock_convex_seed_result = {
      success: false,
      data_source: "none",
      tables_fetched: 0,
      total_records: 0,
      failed_tables: [],
    };
  });

  it("succeeds when convex pull works", async () => {
    mock_convex_seed_result = {
      success: true,
      data_source: "convex",
      tables_fetched: 10,
      total_records: 50,
      failed_tables: [],
    };

    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_mandatory",
    );

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("convex_success");
    expect(result.data_source).toBe("convex");
  });

  it("enters offline mode when convex fails but local data exists", async () => {
    mock_local_storage["sports_org_seeding_complete_v15"] = "true";

    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_mandatory",
    );

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("offline_mode");
    expect(result.data_source).toBe("local");
    expect(result.error_message).toContain("Unable to fetch");
  });

  it("returns convex_required_but_unavailable when convex fails and no local data", async () => {
    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_mandatory",
    );

    expect(result.success).toBe(false);
    expect(result.outcome).toBe("convex_required_but_unavailable");
    expect(result.data_source).toBe("none");
    expect(result.error_message).toContain("Unable to connect");
  });

  it("does NOT fall back to local seeding when convex fails on first time", async () => {
    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_mandatory",
    );

    expect(result.outcome).not.toBe("local_fallback_success");
    expect(result.success).toBe(false);
  });

  it("reports pulling data progress message", async () => {
    mock_convex_seed_result = {
      success: true,
      data_source: "convex",
      tables_fetched: 5,
      total_records: 25,
      failed_tables: [],
    };

    await seed_from_convex_or_local(on_progress, "convex_mandatory");

    const pull_msg = progress_messages.find((m) =>
      m.message.includes("Pulling data from server"),
    );
    expect(pull_msg).toBeDefined();
  });
});

describe("repair fixture stage IDs when seeded data already exists", () => {
  let on_progress: (message: string, percentage: number) => void;

  beforeEach(() => {
    on_progress = () => {};
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
  });

  it("assigns the stage_id to fixtures that have no stage set", async () => {
    mock_local_storage["sports_org_seeding_complete_v15"] = "true";
    mock_competition_stages.push({
      id: "stage-1",
      competition_id: "comp-1",
      stage_order: 1,
      name: "League Stage",
    });
    mock_fixtures.push({
      id: "fixture-1",
      competition_id: "comp-1",
      stage_id: "",
    });

    await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(mock_fixture_repository.update).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({ stage_id: "stage-1" }),
    );
  });

  it("skips fixtures that already have a valid stage_id", async () => {
    mock_local_storage["sports_org_seeding_complete_v15"] = "true";
    mock_competition_stages.push({
      id: "stage-1",
      competition_id: "comp-1",
      stage_order: 1,
      name: "League Stage",
    });
    mock_fixtures.push({
      id: "fixture-1",
      competition_id: "comp-1",
      stage_id: "stage-1",
    });

    await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(mock_fixture_repository.update).not.toHaveBeenCalled();
  });

  it("picks the stage with the lowest stage_order when multiple stages exist", async () => {
    mock_local_storage["sports_org_seeding_complete_v15"] = "true";
    mock_competition_stages.push(
      {
        id: "stage-2",
        competition_id: "comp-1",
        stage_order: 2,
        name: "Knockouts",
      },
      {
        id: "stage-1",
        competition_id: "comp-1",
        stage_order: 1,
        name: "Group Stage",
      },
    );
    mock_fixtures.push({
      id: "fixture-1",
      competition_id: "comp-1",
      stage_id: "",
    });

    await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(mock_fixture_repository.update).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({ stage_id: "stage-1" }),
    );
  });
});
