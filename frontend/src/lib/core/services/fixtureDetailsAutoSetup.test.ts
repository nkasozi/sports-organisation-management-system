import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { auto_create_fixture_details_setup } from "./fixtureDetailsAutoSetup";
import type { Fixture } from "../entities/Fixture";
import type { AutoSetupDependencies } from "./fixtureDetailsAutoSetup";

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture-1",
    organization_id: "org-1",
    home_team_id: "home-1",
    away_team_id: "away-1",
    competition_id: "comp-1",
    ...overrides,
  } as Fixture;
}

describe("auto_create_fixture_details_setup", () => {
  let dependencies: AutoSetupDependencies;
  let fixture: Fixture;

  beforeEach(() => {
    fixture = makeFixture();
    dependencies = {
      fixture_details_setup_use_cases: {
        create: vi
          .fn()
          .mockResolvedValue({ success: true, data: { id: "details-1" } }),
      } as any,
      jersey_color_use_cases: {
        list_jerseys_by_entity: vi.fn().mockResolvedValue({
          success: true,
          data: { items: [{ id: "jersey-1" }] },
        }),
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: [{ id: "jersey-2" }] },
        }),
      } as any,
      official_use_cases: {
        list: vi
          .fn()
          .mockResolvedValue({ success: true, data: [{ id: "official-1" }] }),
      } as any,
      game_official_role_use_cases: {
        list: vi
          .fn()
          .mockResolvedValue({ success: true, data: [{ id: "role-1" }] }),
      } as any,
    };
  });

  afterEach(() => {
    // Print mock call info for debugging
    // eslint-disable-next-line no-console
    console.log(
      "list_jerseys_by_entity calls:",
      vi.mocked(dependencies.jersey_color_use_cases.list_jerseys_by_entity).mock
        .calls,
    );
    // eslint-disable-next-line no-console
    console.log(
      "list calls:",
      vi.mocked(dependencies.jersey_color_use_cases.list).mock.calls,
    );
  });

  it("creates fixture details with populated data", async () => {
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
    );
    expect(result.success).toBe(true);
    expect(
      dependencies.fixture_details_setup_use_cases.create,
    ).toHaveBeenCalled();
    const input = vi.mocked(dependencies.fixture_details_setup_use_cases.create)
      .mock.calls[0][0];
    expect(input.home_team_jersey_id).toBe("jersey-1");
    expect(input.away_team_jersey_id).toBe("jersey-1");
    expect(input.official_jersey_id).toBe("jersey-1");
    expect(input.assigned_officials.length).toBe(1);
    expect(input.assigned_officials[0].official_id).toBe("official-1");
    expect(input.assigned_officials[0].role_id).toBe("role-1");
  });

  it("returns failure if create fails", async () => {
    dependencies.fixture_details_setup_use_cases.create = vi
      .fn()
      .mockResolvedValue({ success: false, error: "fail" });
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("fail");
  });

  it("returns empty assigned_officials if no officials or roles", async () => {
    dependencies.official_use_cases.list = vi
      .fn()
      .mockResolvedValue({ success: true, data: [] });
    dependencies.game_official_role_use_cases.list = vi
      .fn()
      .mockResolvedValue({ success: true, data: [] });
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
    );
    expect(result.success).toBe(true);
    const input = vi.mocked(dependencies.fixture_details_setup_use_cases.create)
      .mock.calls[0][0];
    expect(input.assigned_officials.length).toBe(0);
  });

  it("fails if home team jersey is missing", async () => {
    dependencies.jersey_color_use_cases.list_jerseys_by_entity = vi
      .fn()
      .mockImplementation((type) =>
        type === "team"
          ? { success: true, data: { items: [] } }
          : { success: true, data: { items: [{ id: "jersey-1" }] } },
      );
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toMatch(/No Jerseys found for Home Team/);
  });

  it("fails if away team jersey is missing", async () => {
    dependencies.jersey_color_use_cases.list_jerseys_by_entity = vi
      .fn()
      .mockImplementation((type) =>
        type === "team" && fixture.away_team_id
          ? { success: true, data: { items: [] } }
          : { success: true, data: { items: [{ id: "jersey-1" }] } },
      );
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toMatch(/No Jerseys found for Away Team/);
  });

  it("fails if official jersey is missing", async () => {
    dependencies.jersey_color_use_cases.list_jerseys_by_entity = vi
      .fn()
      .mockImplementation((type) =>
        type === "competition_official"
          ? { success: true, data: { items: [] } }
          : { success: true, data: { items: [{ id: "jersey-1" }] } },
      );
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toMatch(/No Jerseys found for Officials/);
  });

  it("fails if officials are missing", async () => {
    dependencies.official_use_cases.list = vi
      .fn()
      .mockResolvedValue({ success: true, data: [] });
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/No Officials found/);
  });

  it("fails if official roles are missing", async () => {
    dependencies.game_official_role_use_cases.list = vi
      .fn()
      .mockResolvedValue({ success: true, data: [] });
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toMatch(/No Official Roles found/);
  });
});
