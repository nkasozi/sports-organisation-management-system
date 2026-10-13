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
  it("calls seed_with_data on the gender repository", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-abc");
    expect(result.success).toBe(true);

    expect(mock_gender_seed).toHaveBeenCalledTimes(1);
  });

  it("seeds genders with data that includes the given organization_id", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-abc");
    expect(result.success).toBe(true);

    const seeded_genders = mock_gender_seed.mock.calls[0][0] as Array<{
      organization_id: SeedOrganizationId;
    }>;
    expect(seeded_genders.every((g) => g.organization_id === "org-abc")).toBe(
      true,
    );
  });

  it("calls seed_with_data on the identification type repository", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-abc");
    expect(result.success).toBe(true);

    expect(mock_identification_type_seed).toHaveBeenCalledTimes(1);
  });

  it("seeds identification types with data that includes the given organization_id", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-abc");
    expect(result.success).toBe(true);

    const seeded = mock_identification_type_seed.mock.calls[0][0] as Array<{
      organization_id: SeedOrganizationId;
    }>;
    expect(seeded.every((item) => item.organization_id === "org-abc")).toBe(
      true,
    );
  });

  it("calls seed_with_data on the player position repository", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-abc");
    expect(result.success).toBe(true);

    expect(mock_player_position_seed).toHaveBeenCalledTimes(1);
  });

  it("calls seed_with_data on the game official role repository", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-abc");
    expect(result.success).toBe(true);

    expect(mock_game_official_role_seed).toHaveBeenCalledTimes(1);
  });

  it("calls seed_with_data on the game event type repository", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-abc");
    expect(result.success).toBe(true);

    expect(mock_game_event_type_seed).toHaveBeenCalledTimes(1);
  });

  it("calls seed_with_data on the team staff role repository", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-abc");
    expect(result.success).toBe(true);

    expect(mock_team_staff_role_seed).toHaveBeenCalledTimes(1);
  });

  it("seeds all six repositories in a single call", async () => {
    const result =
      await seed_default_lookup_entities_for_organization("org-xyz");
    expect(result.success).toBe(true);

    expect(mock_gender_seed).toHaveBeenCalledTimes(1);
    expect(mock_identification_type_seed).toHaveBeenCalledTimes(1);
    expect(mock_player_position_seed).toHaveBeenCalledTimes(1);
    expect(mock_game_official_role_seed).toHaveBeenCalledTimes(1);
    expect(mock_game_event_type_seed).toHaveBeenCalledTimes(1);
    expect(mock_team_staff_role_seed).toHaveBeenCalledTimes(1);
    expect(mock_competition_format_seed).toHaveBeenCalledTimes(1);
  });
});
