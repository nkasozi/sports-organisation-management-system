import { describe, expect, it, vi } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  can_role_manage_game,
  can_role_rate_officials,
  FIXTURE_DETAIL_MESSAGES,
  FIXTURE_DETAIL_PAGE_STATUS,
  get_fixture_status_badge_class,
  load_fixture_detail,
} from "./fixtureDetailPageState";

const FIXTURE = { id: "fixture-1", status: "completed" } as Fixture;

describe("load_fixture_detail", () => {
  it("returns the loaded fixture", async () => {
    const get_by_id = vi.fn(async () => create_success_result(FIXTURE));
    expect(await load_fixture_detail("fixture-1", get_by_id)).toEqual({
      status: FIXTURE_DETAIL_PAGE_STATUS.LOADED,
      fixture: FIXTURE,
    });
    expect(get_by_id).toHaveBeenCalledWith("fixture-1");
  });

  it("shows a friendly message instead of the raw error on failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await load_fixture_detail("fixture-1", async () =>
        create_failure_result("IndexedDB: transaction aborted"),
      ),
    ).toEqual({
      status: FIXTURE_DETAIL_PAGE_STATUS.FAILED,
      message: FIXTURE_DETAIL_MESSAGES.LOAD_FAILED,
    });
  });
});

describe("fixture detail role rules", () => {
  it("lets officials managers and team managers rate officials", () => {
    expect(can_role_rate_officials("officials_manager")).toBe(true);
    expect(can_role_rate_officials("team_manager")).toBe(true);
    expect(can_role_rate_officials("player")).toBe(false);
  });

  it("lets officials managers and admins manage the game", () => {
    expect(can_role_manage_game("org_admin")).toBe(true);
    expect(can_role_manage_game("super_admin")).toBe(true);
    expect(can_role_manage_game("team_manager")).toBe(false);
  });

  it("falls back to a neutral badge for unknown statuses", () => {
    expect(get_fixture_status_badge_class("completed")).toBe(
      "bg-emerald-100 text-emerald-700",
    );
    expect(get_fixture_status_badge_class("weird")).toBe(
      "bg-gray-100 text-gray-600",
    );
  });
});
