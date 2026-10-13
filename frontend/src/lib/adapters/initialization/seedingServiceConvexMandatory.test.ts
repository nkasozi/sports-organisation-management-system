import { beforeEach, describe, expect, it, vi } from "vitest";

import { seed_from_convex_or_local } from "./seedingService";
import {
  type ConvexSeedResult,
  create_failed_convex_seed_result,
  reset_seeding_service_mocks,
} from "./seedingService.test_support";

let mock_convex_seed_result: ConvexSeedResult =
  create_failed_convex_seed_result();

const seeding_mocks = await vi.hoisted(async () =>
  (await import("./seedingService.test_support")).create_seeding_service_mocks(
    () => mock_convex_seed_result,
  ),
);
const {
  mock_app_settings_store,
  mock_system_user_seed_with_data,
  mock_try_seed_all_tables_from_convex,
} = seeding_mocks;

vi.mock("../../infrastructure/sync/convexSeedingService", () =>
  seeding_mocks.convex_seeding_module(),
);
vi.mock("../../infrastructure/events/EventBus", () =>
  seeding_mocks.event_bus_module(),
);
vi.mock("../../presentation/stores/currentUser", () =>
  seeding_mocks.current_user_module(),
);
vi.mock("../../infrastructure/container", () =>
  seeding_mocks.container_module(),
);
vi.mock("../repositories/InBrowserSystemUserRepository", () =>
  seeding_mocks.system_user_repository_module(),
);
vi.mock("../repositories/InBrowserPlayerPositionRepository", () =>
  seeding_mocks.getter_only_repository_module("PlayerPosition"),
);
vi.mock("./organizationDefaultsSeeder", () =>
  seeding_mocks.organization_defaults_seeder_module(),
);
vi.mock("../repositories/InBrowserTeamStaffRoleRepository", () =>
  seeding_mocks.repository_module("TeamStaffRole"),
);
vi.mock("../repositories/InBrowserGameOfficialRoleRepository", () =>
  seeding_mocks.repository_module("GameOfficialRole"),
);
vi.mock("../repositories/InBrowserCompetitionFormatRepository", () =>
  seeding_mocks.competition_format_repository_module(),
);
vi.mock("../repositories/InBrowserPlayerRepository", () =>
  seeding_mocks.repository_module("Player"),
);
vi.mock("../repositories/InBrowserTeamRepository", () =>
  seeding_mocks.repository_module("Team"),
);
vi.mock("../repositories/InBrowserTeamStaffRepository", () =>
  seeding_mocks.repository_module("TeamStaff"),
);
vi.mock("../repositories/InBrowserOfficialRepository", () =>
  seeding_mocks.repository_module("Official"),
);
vi.mock("../repositories/InBrowserCompetitionRepository", () =>
  seeding_mocks.repository_module("Competition"),
);
vi.mock("../repositories/InBrowserCompetitionTeamRepository", () =>
  seeding_mocks.repository_module("CompetitionTeam"),
);
vi.mock("../repositories/InBrowserPlayerTeamMembershipRepository", () =>
  seeding_mocks.repository_module("PlayerTeamMembership"),
);
vi.mock("../repositories/InBrowserFixtureRepository", () =>
  seeding_mocks.fixture_repository_module(),
);
vi.mock("../repositories/InBrowserCompetitionStageRepository", () =>
  seeding_mocks.competition_stage_repository_module(),
);
vi.mock("../repositories/InBrowserFixtureLineupRepository", () =>
  seeding_mocks.repository_module("FixtureLineup"),
);
vi.mock("../repositories/InBrowserVenueRepository", () =>
  seeding_mocks.repository_module("Venue"),
);
vi.mock("../repositories/InBrowserJerseyColorRepository", () =>
  seeding_mocks.repository_module("JerseyColor"),
);
vi.mock("../repositories/InBrowserIdentificationTypeRepository", () =>
  seeding_mocks.repository_module("IdentificationType"),
);
vi.mock("../repositories/InBrowserGenderRepository", () =>
  seeding_mocks.repository_module("Gender"),
);
vi.mock("../repositories/InBrowserPlayerProfileRepository", () =>
  seeding_mocks.repository_module("PlayerProfile"),
);
vi.mock("../repositories/InBrowserProfileLinkRepository", () =>
  seeding_mocks.repository_module("ProfileLink"),
);
vi.mock("../repositories/InBrowserTeamProfileRepository", () =>
  seeding_mocks.repository_module("TeamProfile"),
);
vi.mock("../../infrastructure/utils/SeedDataGenerator", () =>
  seeding_mocks.seed_data_generator_module(),
);

vi.stubGlobal("window", globalThis);

beforeEach(() => {
  reset_seeding_service_mocks(seeding_mocks);
});

describe("seed_from_convex_or_local — convex_mandatory strategy", () => {
  let progress_messages: Array<{ message: string; percentage: number }>;
  let on_progress: (message: string, percentage: number) => void;

  beforeEach(() => {
    progress_messages = [];
    on_progress = (message: string, percentage: number) => {
      progress_messages.push({ message, percentage });
    };
    Object.keys(mock_app_settings_store).forEach(
      (key) => delete mock_app_settings_store[key],
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
    mock_app_settings_store["sports_org_seeding_complete_v16"] = "true";

    const result = await seed_from_convex_or_local(
      on_progress,
      "convex_mandatory",
    );

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("offline_mode");
    expect(result.data_source).toBe("local");
    expect(result.error_message).toContain("Unable to fetch");
  });
});
