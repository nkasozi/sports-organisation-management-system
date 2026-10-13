import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Fixture } from "../entities/Fixture";
import type { AutoSetupDependencies } from "./fixtureDetailsAutoSetup";
import { auto_create_fixture_details_setup } from "./fixtureDetailsAutoSetup";
import {
  create_auto_setup_dependencies,
  log_jersey_mock_calls,
  makeFixture,
} from "./fixtureDetailsAutoSetup.test_support";

describe("auto_create_fixture_details_setup", () => {
  let dependencies: AutoSetupDependencies;
  let fixture: Fixture;

  beforeEach(() => {
    fixture = makeFixture();
    dependencies = create_auto_setup_dependencies();
  });

  afterEach(() => {
    log_jersey_mock_calls(dependencies);
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
      [],
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
      [],
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
      [],
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toMatch(/No Jerseys found for Officials/);
  });

  it("fails if officials are missing", async () => {
    dependencies.official_use_cases.list = vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [],
        total_count: 0,
        page_number: 1,
        page_size: 100,
        total_pages: 0,
      },
    });
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
      [],
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/No Officials found/);
  });

  it("fails if official roles are missing", async () => {
    dependencies.game_official_role_use_cases.list = vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [],
        total_count: 0,
        page_number: 1,
        page_size: 100,
        total_pages: 0,
      },
    });
    const result = await auto_create_fixture_details_setup(
      fixture,
      dependencies,
      [],
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toMatch(/No Official Roles found/);
  });
});
