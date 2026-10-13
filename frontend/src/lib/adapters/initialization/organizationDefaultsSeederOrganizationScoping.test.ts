import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Organization } from "$lib/core/entities/Organization";

import { seed_default_lookup_entities_for_organization } from "./organizationDefaultsSeeder";

type SeedOrganizationId = Organization["id"];

const success_result = { success: true, data: 2 };
const mock_gender_seed = vi.fn().mockResolvedValue(success_result);
const mock_identification_type_seed = vi.fn().mockResolvedValue(success_result);
const mock_player_position_seed = vi.fn().mockResolvedValue(success_result);
const mock_game_official_role_seed = vi.fn().mockResolvedValue(success_result);
const mock_game_event_type_seed = vi.fn().mockResolvedValue(success_result);
const mock_team_staff_role_seed = vi.fn().mockResolvedValue(success_result);
const mock_competition_format_seed = vi.fn().mockResolvedValue(success_result);

vi.mock("../repositories/InBrowserGenderRepository", () => ({
  get_gender_repository: vi.fn(() => ({
    seed_with_data: mock_gender_seed,
  })),
  InBrowserGenderRepository: vi.fn(),
}));

vi.mock("../repositories/InBrowserIdentificationTypeRepository", () => ({
  get_identification_type_repository: vi.fn(() => ({
    seed_with_data: mock_identification_type_seed,
  })),
  InBrowserIdentificationTypeRepository: vi.fn(),
}));

vi.mock("../repositories/InBrowserPlayerPositionRepository", () => ({
  get_player_position_repository: vi.fn(() => ({
    seed_with_data: mock_player_position_seed,
  })),
  InBrowserPlayerPositionRepository: vi.fn(),
  create_default_player_positions_for_organization: vi.fn(
    (org_id: SeedOrganizationId) => [
      { name: "Forward", organization_id: org_id },
    ],
  ),
}));

vi.mock("../repositories/InBrowserGameOfficialRoleRepository", () => ({
  get_game_official_role_repository: vi.fn(() => ({
    seed_with_data: mock_game_official_role_seed,
  })),
  InBrowserGameOfficialRoleRepository: vi.fn(),
  create_default_game_official_roles_for_organization: vi.fn(
    (org_id: string) => [{ name: "Referee", organization_id: org_id }],
  ),
}));

vi.mock("../repositories/InBrowserGameEventTypeRepository", () => ({
  get_game_event_type_repository: vi.fn(() => ({
    seed_with_data: mock_game_event_type_seed,
  })),
  InBrowserGameEventTypeRepository: vi.fn(),
  create_default_game_event_types_for_organization: vi.fn((org_id: string) => [
    { name: "Goal", organization_id: org_id },
  ]),
}));

vi.mock("../repositories/InBrowserTeamStaffRoleRepository", () => ({
  get_team_staff_role_repository: vi.fn(() => ({
    seed_with_data: mock_team_staff_role_seed,
  })),
  InBrowserTeamStaffRoleRepository: vi.fn(),
  create_default_team_staff_roles_for_organization: vi.fn((org_id: string) => [
    { name: "Coach", organization_id: org_id },
  ]),
}));

vi.mock("../repositories/InBrowserCompetitionFormatRepository", () => ({
  get_competition_format_repository: vi.fn(() => ({
    seed_with_data: mock_competition_format_seed,
  })),
  InBrowserCompetitionFormatRepository: vi.fn(),
  create_default_competition_formats_for_organization: vi.fn(
    (org_id: string) => [{ name: "Standard League", organization_id: org_id }],
  ),
}));

vi.mock("../../infrastructure/utils/SeedDataGenerator", () => ({
  create_seed_genders: vi.fn((org_id: string) => [
    { name: "Male", organization_id: org_id },
    { name: "Female", organization_id: org_id },
  ]),
  create_seed_identification_types: vi.fn((org_id: string) => [
    { name: "National ID", organization_id: org_id },
  ]),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("seed_default_lookup_entities_for_organization", () => {
  it("passes the correct organization_id to player position seeder", async () => {
    const { create_default_player_positions_for_organization } =
      await import("../repositories/InBrowserPlayerPositionRepository");

    const result =
      await seed_default_lookup_entities_for_organization("org-positions-test");
    expect(result.success).toBe(true);

    expect(
      create_default_player_positions_for_organization,
    ).toHaveBeenCalledWith("org-positions-test");
  });

  it("passes the correct organization_id to game event type seeder", async () => {
    const { create_default_game_event_types_for_organization } =
      await import("../repositories/InBrowserGameEventTypeRepository");

    const result =
      await seed_default_lookup_entities_for_organization("org-events-test");
    expect(result.success).toBe(true);

    expect(
      create_default_game_event_types_for_organization,
    ).toHaveBeenCalledWith("org-events-test");
  });

  it("passes the correct organization_id to team staff role seeder", async () => {
    const { create_default_team_staff_roles_for_organization } =
      await import("../repositories/InBrowserTeamStaffRoleRepository");

    const result =
      await seed_default_lookup_entities_for_organization("org-staff-test");
    expect(result.success).toBe(true);

    expect(
      create_default_team_staff_roles_for_organization,
    ).toHaveBeenCalledWith("org-staff-test");
  });

  it("resolves with a success result", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-success");

    expect(result.success).toBe(true);
  });

  it("returns OrgSeedResult with all six seeded counts when all steps succeed", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-counts");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.organization_id).toBe("org-counts");
    expect(result.data.genders_seeded).toBe(2);
    expect(result.data.identification_types_seeded).toBe(2);
    expect(result.data.player_positions_seeded).toBe(2);
    expect(result.data.game_official_roles_seeded).toBe(2);
    expect(result.data.game_event_types_seeded).toBe(2);
    expect(result.data.team_staff_roles_seeded).toBe(2);
    expect(result.data.competition_formats_seeded).toBe(2);
  });
});
