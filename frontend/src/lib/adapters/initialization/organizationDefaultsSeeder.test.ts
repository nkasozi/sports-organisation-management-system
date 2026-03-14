import { describe, it, expect, vi, beforeEach } from "vitest";
import { seed_default_lookup_entities_for_organization } from "./organizationDefaultsSeeder";

const success_result = { success: true, data: 2 };
const mock_gender_seed = vi.fn().mockResolvedValue(success_result);
const mock_identification_type_seed = vi.fn().mockResolvedValue(success_result);
const mock_player_position_seed = vi.fn().mockResolvedValue(success_result);
const mock_game_official_role_seed = vi.fn().mockResolvedValue(success_result);
const mock_game_event_type_seed = vi.fn().mockResolvedValue(success_result);
const mock_team_staff_role_seed = vi.fn().mockResolvedValue(success_result);

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

  it("resolves with a success result", async () => {
    const result = await seed_default_lookup_entities_for_organization("org-success");

    expect(result.success).toBe(true);
  });

  it("returns OrgSeedResult with all six seeded counts when all steps succeed", async () => {
    const result = await seed_default_lookup_entities_for_organization("org-counts");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.organization_id).toBe("org-counts");
    expect(result.data.genders_seeded).toBe(2);
    expect(result.data.identification_types_seeded).toBe(2);
    expect(result.data.player_positions_seeded).toBe(2);
    expect(result.data.game_official_roles_seeded).toBe(2);
    expect(result.data.game_event_types_seeded).toBe(2);
    expect(result.data.team_staff_roles_seeded).toBe(2);
  });

  it("returns a failure result when gender seeding fails", async () => {
    mock_gender_seed.mockResolvedValueOnce({ success: false, error: "Gender DB error" });

    const result = await seed_default_lookup_entities_for_organization("org-fail");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("Gender");
  });

  it("stops after first failure and does not call subsequent repositories", async () => {
    mock_gender_seed.mockResolvedValueOnce({ success: false, error: "Gender DB error" });

    await seed_default_lookup_entities_for_organization("org-stop");

    expect(mock_gender_seed).toHaveBeenCalledTimes(1);
    expect(mock_identification_type_seed).not.toHaveBeenCalled();
    expect(mock_player_position_seed).not.toHaveBeenCalled();
    expect(mock_game_official_role_seed).not.toHaveBeenCalled();
    expect(mock_game_event_type_seed).not.toHaveBeenCalled();
    expect(mock_team_staff_role_seed).not.toHaveBeenCalled();
  });

  it("stops at identification types failure and does not call subsequent repositories", async () => {
    mock_identification_type_seed.mockResolvedValueOnce({ success: false, error: "ID type DB error" });

    await seed_default_lookup_entities_for_organization("org-stop-2");

    expect(mock_gender_seed).toHaveBeenCalledTimes(1);
    expect(mock_identification_type_seed).toHaveBeenCalledTimes(1);
    expect(mock_player_position_seed).not.toHaveBeenCalled();
  });
});
