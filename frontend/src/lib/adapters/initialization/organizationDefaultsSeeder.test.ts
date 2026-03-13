import { describe, it, expect, vi, beforeEach } from "vitest";
import { seed_default_lookup_entities_for_organization } from "./organizationDefaultsSeeder";

const mock_gender_seed = vi.fn().mockResolvedValue(undefined);
const mock_identification_type_seed = vi.fn().mockResolvedValue(undefined);
const mock_player_position_seed = vi.fn().mockResolvedValue(undefined);
const mock_game_official_role_seed = vi.fn().mockResolvedValue(undefined);
const mock_game_event_type_seed = vi.fn().mockResolvedValue(undefined);
const mock_team_staff_role_seed = vi.fn().mockResolvedValue(undefined);

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
  create_default_player_positions_for_organization: vi.fn((org_id: string) => [
    { name: "Forward", organization_id: org_id },
  ]),
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
  create_default_game_event_types_for_organization: vi.fn(
    (org_id: string) => [{ name: "Goal", organization_id: org_id }],
  ),
}));

vi.mock("../repositories/InBrowserTeamStaffRoleRepository", () => ({
  get_team_staff_role_repository: vi.fn(() => ({
    seed_with_data: mock_team_staff_role_seed,
  })),
  InBrowserTeamStaffRoleRepository: vi.fn(),
  create_default_team_staff_roles_for_organization: vi.fn(
    (org_id: string) => [{ name: "Coach", organization_id: org_id }],
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
    await seed_default_lookup_entities_for_organization("org-abc");

    expect(mock_gender_seed).toHaveBeenCalledTimes(1);
  });

  it("seeds genders with data that includes the given organization_id", async () => {
    await seed_default_lookup_entities_for_organization("org-abc");

    const seeded_genders = mock_gender_seed.mock.calls[0][0] as Array<{
      organization_id: string;
    }>;
    expect(seeded_genders.every((g) => g.organization_id === "org-abc")).toBe(
      true,
    );
  });

  it("calls seed_with_data on the identification type repository", async () => {
    await seed_default_lookup_entities_for_organization("org-abc");

    expect(mock_identification_type_seed).toHaveBeenCalledTimes(1);
  });

  it("seeds identification types with data that includes the given organization_id", async () => {
    await seed_default_lookup_entities_for_organization("org-abc");

    const seeded = mock_identification_type_seed.mock.calls[0][0] as Array<{
      organization_id: string;
    }>;
    expect(seeded.every((item) => item.organization_id === "org-abc")).toBe(
      true,
    );
  });

  it("calls seed_with_data on the player position repository", async () => {
    await seed_default_lookup_entities_for_organization("org-abc");

    expect(mock_player_position_seed).toHaveBeenCalledTimes(1);
  });

  it("calls seed_with_data on the game official role repository", async () => {
    await seed_default_lookup_entities_for_organization("org-abc");

    expect(mock_game_official_role_seed).toHaveBeenCalledTimes(1);
  });

  it("calls seed_with_data on the game event type repository", async () => {
    await seed_default_lookup_entities_for_organization("org-abc");

    expect(mock_game_event_type_seed).toHaveBeenCalledTimes(1);
  });

  it("calls seed_with_data on the team staff role repository", async () => {
    await seed_default_lookup_entities_for_organization("org-abc");

    expect(mock_team_staff_role_seed).toHaveBeenCalledTimes(1);
  });

  it("seeds all six repositories in a single call", async () => {
    await seed_default_lookup_entities_for_organization("org-xyz");

    expect(mock_gender_seed).toHaveBeenCalledTimes(1);
    expect(mock_identification_type_seed).toHaveBeenCalledTimes(1);
    expect(mock_player_position_seed).toHaveBeenCalledTimes(1);
    expect(mock_game_official_role_seed).toHaveBeenCalledTimes(1);
    expect(mock_game_event_type_seed).toHaveBeenCalledTimes(1);
    expect(mock_team_staff_role_seed).toHaveBeenCalledTimes(1);
  });

  it("passes the correct organization_id to player position seeder", async () => {
    const { create_default_player_positions_for_organization } = await import(
      "../repositories/InBrowserPlayerPositionRepository"
    );

    await seed_default_lookup_entities_for_organization("org-positions-test");

    expect(create_default_player_positions_for_organization).toHaveBeenCalledWith(
      "org-positions-test",
    );
  });

  it("passes the correct organization_id to game event type seeder", async () => {
    const { create_default_game_event_types_for_organization } = await import(
      "../repositories/InBrowserGameEventTypeRepository"
    );

    await seed_default_lookup_entities_for_organization("org-events-test");

    expect(
      create_default_game_event_types_for_organization,
    ).toHaveBeenCalledWith("org-events-test");
  });

  it("passes the correct organization_id to team staff role seeder", async () => {
    const { create_default_team_staff_roles_for_organization } = await import(
      "../repositories/InBrowserTeamStaffRoleRepository"
    );

    await seed_default_lookup_entities_for_organization("org-staff-test");

    expect(
      create_default_team_staff_roles_for_organization,
    ).toHaveBeenCalledWith("org-staff-test");
  });

  it("resolves successfully without errors", async () => {
    await expect(
      seed_default_lookup_entities_for_organization("org-success"),
    ).resolves.toBeUndefined();
  });
});
