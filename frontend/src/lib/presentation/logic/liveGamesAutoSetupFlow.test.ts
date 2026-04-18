import { beforeEach, describe, expect, it, vi } from "vitest";

import { handle_missing_fixture_details } from "./liveGamesAutoSetupFlow";

const { auto_create_fixture_details_setup_mock, publish_checks_mock } =
  vi.hoisted(() => ({
    auto_create_fixture_details_setup_mock: vi.fn(),
    publish_checks_mock: vi.fn().mockImplementation(async () => {}),
  }));

vi.mock("$lib/core/services/fixtureDetailsAutoSetup", () => ({
  auto_create_fixture_details_setup: auto_create_fixture_details_setup_mock,
}));

vi.mock("./liveGamesStartFlowShared", async () => {
  const actual = await vi.importActual<
    typeof import("./liveGamesStartFlowShared")
  >("./liveGamesStartFlowShared");
  return {
    ...actual,
    publish_checks: publish_checks_mock,
  };
});

describe("liveGamesAutoSetupFlow", () => {
  function create_dependencies() {
    return {
      competition_use_cases: { get_by_id: vi.fn() },
      get_current_role: vi.fn(() => "player"),
      can_access_route: vi.fn(() => false),
      update_checks: vi.fn(),
      set_is_starting: vi.fn(),
      goto: vi.fn(async () => {}),
      restart: vi.fn(async () => {}),
      fixture_details_setup_use_cases: {} as never,
      jersey_color_use_cases: {} as never,
      official_use_cases: {} as never,
      game_official_role_use_cases: {} as never,
    };
  }

  beforeEach(() => {
    auto_create_fixture_details_setup_mock.mockReset();
    publish_checks_mock.mockClear();
  });

  it("restores the original officials failure when auto setup is not allowed", async () => {
    const dependencies = create_dependencies();
    dependencies.competition_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { allow_auto_fixture_details_setup: false },
    });
    const checks = [
      {
        check_name: "officials",
        status: "failed",
        message: "Original failure",
        fix_suggestion: "",
      },
    ];
    const officials_check = {
      check_name: "officials",
      status: "failed",
      message: "Original failure",
      fix_suggestion: "",
    };

    await expect(
      handle_missing_fixture_details(
        { id: "fixture-1", competition_id: "competition-1" } as never,
        checks as never,
        officials_check as never,
        dependencies as never,
      ),
    ).resolves.toBe(true);
    expect(checks.at(-1)).toEqual(officials_check);
    expect(dependencies.set_is_starting).toHaveBeenCalledWith(
      "fixture-1",
      false,
    );
  });

  it("redirects to fixture details when auto setup is enabled and the user can access the route", async () => {
    const dependencies = create_dependencies();
    dependencies.competition_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { allow_auto_fixture_details_setup: true },
    });
    dependencies.can_access_route.mockReturnValue(true);
    const checks = [
      {
        check_name: "officials",
        status: "failed",
        message: "Missing",
        fix_suggestion: "",
      },
    ];

    await expect(
      handle_missing_fixture_details(
        { id: "fixture-1", competition_id: "competition-1" } as never,
        checks as never,
        {
          check_name: "officials",
          status: "failed",
          message: "Missing",
          fix_suggestion: "",
        } as never,
        dependencies as never,
      ),
    ).resolves.toBe(true);
    expect(dependencies.goto).toHaveBeenCalledWith(
      "/fixture-details-setup?fixture_id=fixture-1",
    );
  });

  it("fails gracefully when silent auto creation cannot create fixture details", async () => {
    const dependencies = create_dependencies();
    dependencies.competition_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { allow_auto_fixture_details_setup: true },
    });
    auto_create_fixture_details_setup_mock.mockResolvedValue({
      success: false,
      error: "missing officials",
    });
    const checks = [
      {
        check_name: "officials",
        status: "failed",
        message: "Missing",
        fix_suggestion: "",
      },
    ];

    await expect(
      handle_missing_fixture_details(
        { id: "fixture-1", competition_id: "competition-1" } as never,
        checks as never,
        {
          check_name: "officials",
          status: "failed",
          message: "Missing",
          fix_suggestion: "",
        } as never,
        dependencies as never,
      ),
    ).resolves.toBe(true);
    expect(checks.at(-1)).toEqual({
      check_name: "silent_create",
      status: "failed",
      message: "Failed to auto-create fixture details: missing officials",
      fix_suggestion:
        "Contact an administrator to set up fixture details for this game",
    });
    expect(dependencies.set_is_starting).toHaveBeenCalledWith(
      "fixture-1",
      false,
    );
  });

  it("restarts the live game when fixture details are auto-created successfully", async () => {
    const dependencies = create_dependencies();
    dependencies.competition_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { allow_auto_fixture_details_setup: true },
    });
    auto_create_fixture_details_setup_mock.mockResolvedValue({ success: true });
    const fixture = { id: "fixture-1", competition_id: "competition-1" };
    const checks = [
      {
        check_name: "officials",
        status: "failed",
        message: "Missing",
        fix_suggestion: "",
      },
    ];

    await expect(
      handle_missing_fixture_details(
        fixture as never,
        checks as never,
        {
          check_name: "officials",
          status: "failed",
          message: "Missing",
          fix_suggestion: "",
        } as never,
        dependencies as never,
      ),
    ).resolves.toBe(true);
    expect(dependencies.restart).toHaveBeenCalledWith(fixture);
  });
});
