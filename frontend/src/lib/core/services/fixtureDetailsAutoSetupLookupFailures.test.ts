import { beforeEach, describe, expect, it, vi } from "vitest";

import { auto_create_fixture_details_setup } from "./fixtureDetailsAutoSetup";
import {
  create_auto_setup_dependencies,
  makeFixture,
} from "./fixtureDetailsAutoSetup.test_support";
import {
  FIXTURE_DETAILS_AUTO_SETUP_EVENT,
  FIXTURE_DETAILS_AUTO_SETUP_LOOKUP_FAILED_MESSAGE,
} from "./FixtureDetailsAutoSetupConstants";

describe("auto_create_fixture_details_setup lookup failures", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fails fast with a friendly message when officials cannot be loaded", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dependencies = create_auto_setup_dependencies();
    dependencies.official_use_cases.list = vi
      .fn()
      .mockResolvedValue({ success: false, error: "db offline" });
    const result = await auto_create_fixture_details_setup(
      makeFixture(),
      dependencies,
    );
    expect(result).toEqual({
      success: false,
      error: FIXTURE_DETAILS_AUTO_SETUP_LOOKUP_FAILED_MESSAGE,
    });
    expect(
      dependencies.fixture_details_setup_use_cases.create,
    ).not.toHaveBeenCalled();
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: FIXTURE_DETAILS_AUTO_SETUP_EVENT.LOOKUP_FAILED,
        technical_detail: "db offline",
        fixture_id: "fixture-1",
        lookup: "officials",
      }),
    );
  });

  it("does not silently succeed when roles cannot be loaded and no officials exist", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const dependencies = create_auto_setup_dependencies();
    dependencies.official_use_cases.list = vi.fn().mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    dependencies.game_official_role_use_cases.list = vi
      .fn()
      .mockResolvedValue({ success: false, error: "roles offline" });
    const result = await auto_create_fixture_details_setup(
      makeFixture(),
      dependencies,
    );
    expect(result.success).toBe(false);
  });

  it("logs a structured event when jersey lookup fails", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dependencies = create_auto_setup_dependencies();
    dependencies.jersey_color_use_cases.list_jerseys_by_entity = vi
      .fn()
      .mockResolvedValue({ success: false, error: "jerseys offline" });
    const result = await auto_create_fixture_details_setup(
      makeFixture(),
      dependencies,
    );
    expect(result.success).toBe(false);
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: FIXTURE_DETAILS_AUTO_SETUP_EVENT.LOOKUP_FAILED,
        lookup: "home_jerseys",
      }),
    );
  });
});
