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
    seed_with_data: vi.fn().mockResolvedValue(undefined),
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

const { create_empty_repo } = vi.hoisted(() => ({
  create_empty_repo: () => ({
    seed_with_data: vi.fn().mockResolvedValue(undefined),
    find_all: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }),
    find_all_with_filter: vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [] } }),
  }),
}));

vi.mock("../repositories/InBrowserPlayerPositionRepository", () => ({
  get_player_position_repository: create_empty_repo,
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
  get_competition_format_repository: create_empty_repo,
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
  get_fixture_repository: create_empty_repo,
  InBrowserFixtureRepository: vi.fn(),
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
    mock_local_storage["sports_org_seeding_complete_v11"] = "true";

    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_first_with_local_fallback",
    );

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("local_fallback_success");
    expect(result.data_source).toBe("local");
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

    expect(mock_local_storage["sports_org_seeding_complete_v11"]).toBe("true");
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
    mock_local_storage["sports_org_seeding_complete_v11"] = "true";

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
