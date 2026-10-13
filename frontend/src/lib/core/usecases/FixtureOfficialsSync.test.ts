import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  FixtureDetailsSetupRepository,
  FixtureRepository,
  GameOfficialRoleRepository,
} from "../interfaces/ports";
import { create_fixture_details_setup_use_cases } from "./FixtureDetailsSetupUseCases";
import { create_fixture_officials_sync } from "./FixtureOfficialsSync";

const SETUP_INPUT = {
  organization_id: "org_default_1",
  fixture_id: "fixture-1",
  home_team_jersey_id: "",
  away_team_jersey_id: "",
  official_jersey_id: "",
  assigned_officials: [
    { official_id: "official-1", role_id: "role-umpire" },
    { official_id: "official-2", role_id: "role-technical" },
  ],
  assignment_notes: "",
  confirmation_status: "pending",
  status: "active",
};

function create_setup_repository(): FixtureDetailsSetupRepository {
  return {
    find_all: vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [],
        total_count: 0,
        page_number: 1,
        page_size: 1,
        total_pages: 0,
      },
    }),
    create: vi.fn(async (input: object) => ({
      success: true,
      data: { ...input, id: "setup-1" },
    })),
  } as unknown as FixtureDetailsSetupRepository;
}

function create_role_repository(): GameOfficialRoleRepository {
  const role_names: Record<string, string> = {
    "role-umpire": "Umpire",
    "role-technical": "Technical Table",
  };
  return {
    find_by_id: vi.fn(async (role_id: string) => ({
      success: true,
      data: { id: role_id, name: role_names[role_id] },
    })),
  } as unknown as GameOfficialRoleRepository;
}

describe("saving fixture details keeps the fixture's officials in step", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the assigned officials, with role names, onto the fixture", async () => {
    const fixture_repository = {
      update: vi.fn().mockResolvedValue({ success: true, data: {} }),
    } as unknown as FixtureRepository;
    const use_cases = create_fixture_details_setup_use_cases(
      create_setup_repository(),
      create_fixture_officials_sync({
        fixture_repository,
        role_repository: create_role_repository(),
      }),
    );

    const result = await use_cases.create(SETUP_INPUT as never);

    expect(result.success).toBe(true);
    expect(fixture_repository.update).toHaveBeenCalledWith("fixture-1", {
      assigned_officials: [
        {
          official_id: "official-1",
          role_id: "role-umpire",
          role_name: "Umpire",
        },
        {
          official_id: "official-2",
          role_id: "role-technical",
          role_name: "Technical Table",
        },
      ],
    });
  });

  it("reports a friendly failure when the fixture cannot be updated", async () => {
    const fixture_repository = {
      update: vi.fn().mockResolvedValue({ success: false, error: "disk full" }),
    } as unknown as FixtureRepository;
    const use_cases = create_fixture_details_setup_use_cases(
      create_setup_repository(),
      create_fixture_officials_sync({
        fixture_repository,
        role_repository: create_role_repository(),
      }),
    );

    const result = await use_cases.create(SETUP_INPUT as never);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).not.toContain("disk full");
  });
});
