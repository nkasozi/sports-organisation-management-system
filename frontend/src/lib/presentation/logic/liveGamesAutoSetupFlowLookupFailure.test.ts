import { describe, expect, it, vi } from "vitest";

import { handle_missing_fixture_details } from "./liveGamesAutoSetupFlow";

vi.mock("./liveGamesStartFlowShared", async () => {
  const actual = await vi.importActual<
    typeof import("./liveGamesStartFlowShared")
  >("./liveGamesStartFlowShared");
  return { ...actual, publish_checks: vi.fn(async () => {}) };
});

const OFFICIALS_CHECK = {
  check_name: "officials",
  status: "failed",
  message: "No officials assigned to this fixture",
  fix_suggestion: "Go to the Fixture Details Setup page",
} as const;

function create_dependencies(competition_result: unknown): {
  competition_use_cases: { get_by_id: ReturnType<typeof vi.fn> };
  can_access_route: ReturnType<typeof vi.fn>;
  get_current_role: ReturnType<typeof vi.fn>;
  update_checks: ReturnType<typeof vi.fn>;
  set_is_starting: ReturnType<typeof vi.fn>;
  goto: ReturnType<typeof vi.fn>;
} {
  return {
    competition_use_cases: { get_by_id: vi.fn(async () => competition_result) },
    can_access_route: vi.fn(() => true),
    get_current_role: vi.fn(() => "org_admin"),
    update_checks: vi.fn(),
    set_is_starting: vi.fn(),
    goto: vi.fn(async () => {}),
  };
}

describe("handle_missing_fixture_details when the competition cannot be loaded", () => {
  it("says the competition settings could not be loaded instead of hiding the failure", async () => {
    const dependencies = create_dependencies({
      success: false,
      error: "Competition not found",
    });
    const checks = [{ ...OFFICIALS_CHECK }];

    await handle_missing_fixture_details(
      { id: "fixture-1", competition_id: "competition-1" } as never,
      checks as never,
      OFFICIALS_CHECK as never,
      dependencies as never,
    );

    expect(checks.at(-1)).toEqual({
      ...OFFICIALS_CHECK,
      message:
        "We could not load this competition's settings, so fixture details were not set up automatically. Please try again.",
    });
    expect(dependencies.goto).not.toHaveBeenCalled();
    expect(dependencies.set_is_starting).toHaveBeenCalledWith(
      "fixture-1",
      false,
    );
  });

  it("redirects to fixture details setup when the competition allows auto setup", async () => {
    const dependencies = create_dependencies({
      success: true,
      data: { id: "competition-1", allow_auto_fixture_details_setup: true },
    });

    await handle_missing_fixture_details(
      { id: "fixture-1", competition_id: "competition-1" } as never,
      [{ ...OFFICIALS_CHECK }] as never,
      OFFICIALS_CHECK as never,
      dependencies as never,
    );

    expect(dependencies.goto).toHaveBeenCalledWith(
      "/fixture-details-setup?fixture_id=fixture-1",
    );
  });
});
