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
    );
    expect(result.success).toBe(true);
    const input = vi.mocked(dependencies.fixture_details_setup_use_cases.create)
      .mock.calls[0][0];
    expect(input.assigned_officials.length).toBe(0);
  });
});
