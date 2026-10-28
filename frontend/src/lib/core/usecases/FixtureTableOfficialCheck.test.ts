import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  FixtureDetailsSetupRepository,
  FixtureRepository,
  GameOfficialRoleRepository,
} from "../interfaces/ports";
import { create_fixture_details_setup_use_cases } from "./FixtureDetailsSetupUseCases";
import { create_fixture_officials_sync } from "./FixtureOfficialsSync";

const ROLES: Record<string, { code: string; is_table_official?: boolean }> = {
  "role-umpire": { code: "UMP1", is_table_official: false },
  "role-table": { code: "TO", is_table_official: true },
};

function build_use_cases(): {
  use_cases: ReturnType<typeof create_fixture_details_setup_use_cases>;
  setup_repository: FixtureDetailsSetupRepository;
} {
  const setup_repository = {
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
    find_by_id: vi
      .fn()
      .mockResolvedValue({ success: true, data: { id: "setup-1" } }),
    create: vi.fn(async (input: object) => ({
      success: true,
      data: { ...input, id: "setup-1" },
    })),
    update: vi.fn(async (id: string, input: object) => ({
      success: true,
      data: { id, fixture_id: "fixture-1", assigned_officials: [], ...input },
    })),
  } as unknown as FixtureDetailsSetupRepository;
  const role_repository = {
    find_by_id: vi.fn(async (role_id: string) =>
      ROLES[role_id]
        ? {
            success: true,
            data: { id: role_id, name: role_id, ...ROLES[role_id] },
          }
        : { success: false, error: "not found" },
    ),
  } as unknown as GameOfficialRoleRepository;
  const fixture_repository = {
    update: vi.fn().mockResolvedValue({ success: true, data: {} }),
  } as unknown as FixtureRepository;
  return {
    setup_repository,
    use_cases: create_fixture_details_setup_use_cases(
      setup_repository,
      create_fixture_officials_sync({ fixture_repository, role_repository }),
    ),
  };
}

function setup_with(role_ids: string[]): Record<string, unknown> {
  return {
    organization_id: "org_1",
    fixture_id: "fixture-1",
    home_team_jersey_id: "",
    away_team_jersey_id: "",
    official_jersey_id: "",
    assigned_officials: role_ids.map((role_id, index) => ({
      official_id: `official-${index}`,
      role_id,
    })),
    assignment_notes: "",
    confirmation_status: "pending",
    status: "active",
  };
}

describe("every game needs a table official", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses to save a game's officials without a table official", async () => {
    const { use_cases, setup_repository } = build_use_cases();

    const result = await use_cases.create(setup_with(["role-umpire"]) as never);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("table official");
    expect(setup_repository.create).not.toHaveBeenCalled();
  });

  it("saves a game's officials when one of them runs the table", async () => {
    const { use_cases } = build_use_cases();

    const result = await use_cases.create(
      setup_with(["role-umpire", "role-table"]) as never,
    );

    expect(result.success).toBe(true);
  });

  it("checks edits that change the officials, but not other edits", async () => {
    const { use_cases } = build_use_cases();

    const without_table = await use_cases.update(
      "setup-1" as never,
      {
        assigned_officials: [{ official_id: "o1", role_id: "role-umpire" }],
      } as never,
    );
    const notes_only = await use_cases.update(
      "setup-1" as never,
      {
        assignment_notes: "Arrive early",
      } as never,
    );

    expect(without_table.success).toBe(false);
    expect(notes_only.success).toBe(true);
  });
});
