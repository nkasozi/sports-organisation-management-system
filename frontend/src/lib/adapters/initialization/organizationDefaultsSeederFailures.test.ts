import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Organization } from "$lib/core/entities/Organization";
import { create_none_option } from "$lib/core/types/Option";

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

const seed_without_sport = (
  organization_id: string,
): ReturnType<typeof seed_default_lookup_entities_for_organization> =>
  seed_default_lookup_entities_for_organization(
    organization_id,
    create_none_option(),
  );

describe("seed_default_lookup_entities_for_organization", () => {
  it("returns a failure result when gender seeding fails", async () => {
    mock_gender_seed.mockResolvedValueOnce({
      success: false,
      error: "Gender DB error",
    });

    const result = await seed_without_sport("org-fail");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Failed to set up default genders");
  });

  it("stops after first failure and does not call subsequent repositories", async () => {
    mock_gender_seed.mockResolvedValueOnce({
      success: false,
      error: "Gender DB error",
    });

    const result = await seed_without_sport("org-stop");
    expect(result.success).toBe(false);

    expect(mock_gender_seed).toHaveBeenCalledTimes(1);
    expect(mock_identification_type_seed).not.toHaveBeenCalled();
    expect(mock_player_position_seed).not.toHaveBeenCalled();
    expect(mock_game_official_role_seed).not.toHaveBeenCalled();
    expect(mock_game_event_type_seed).not.toHaveBeenCalled();
    expect(mock_team_staff_role_seed).not.toHaveBeenCalled();
  });

  it("stops at identification types failure and does not call subsequent repositories", async () => {
    mock_identification_type_seed.mockResolvedValueOnce({
      success: false,
      error: "ID type DB error",
    });

    const result = await seed_without_sport("org-stop-2");
    expect(result.success).toBe(false);

    expect(mock_gender_seed).toHaveBeenCalledTimes(1);
    expect(mock_identification_type_seed).toHaveBeenCalledTimes(1);
    expect(mock_player_position_seed).not.toHaveBeenCalled();
  });

  it("calls seed_with_data on the competition format repository", async () => {
    const result = await seed_without_sport("org-abc");
    expect(result.success).toBe(true);

    expect(mock_competition_format_seed).toHaveBeenCalledTimes(1);
  });

  it("seeds competition formats with data that includes the given organization_id", async () => {
    const result = await seed_without_sport("org-abc");
    expect(result.success).toBe(true);

    const seeded = mock_competition_format_seed.mock.calls[0][0] as Array<{
      organization_id: SeedOrganizationId;
    }>;
    expect(seeded.every((item) => item.organization_id === "org-abc")).toBe(
      true,
    );
  });

  it("passes the correct organization_id to competition format seeder", async () => {
    const { create_default_competition_formats_for_organization } =
      await import("../repositories/InBrowserCompetitionFormatRepository");

    const result = await seed_without_sport("org-formats-test");
    expect(result.success).toBe(true);

    expect(
      create_default_competition_formats_for_organization,
    ).toHaveBeenCalledWith("org-formats-test");
  });

  it("stops at competition formats failure and returns a failure result", async () => {
    mock_competition_format_seed.mockResolvedValueOnce({
      success: false,
      error: "Format DB error",
    });

    const result = await seed_without_sport("org-fmt-fail");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Failed to set up default competition formats");
  });
});
