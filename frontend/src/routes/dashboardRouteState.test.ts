import { describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  begin_dashboard_load,
  dashboard_data_of,
  DASHBOARD_ROUTE_MESSAGES,
  DASHBOARD_ROUTE_STATUS,
  EMPTY_DASHBOARD_DATA,
  settle_dashboard_load,
} from "./dashboardRouteState";

const LOADED = {
  ...EMPTY_DASHBOARD_DATA,
  stats: { organizations: 1, competitions: 2, teams: 3, players: 4 },
};

describe("dashboard route state", () => {
  it("becomes ready with loaded data", () => {
    expect(settle_dashboard_load(create_success_result(LOADED))).toEqual({
      status: DASHBOARD_ROUTE_STATUS.READY,
      data: LOADED,
    });
  });

  it("keeps showing previous data while reloading", () => {
    const reloading = begin_dashboard_load(
      settle_dashboard_load(create_success_result(LOADED)),
    );
    expect(reloading.status).toBe(DASHBOARD_ROUTE_STATUS.LOADING);
    expect(dashboard_data_of(reloading)).toEqual(LOADED);
  });

  it("fails with a friendly message that names the real cause", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = settle_dashboard_load(create_failure_result("timeout"));
    expect(failed).toEqual({
      status: DASHBOARD_ROUTE_STATUS.FAILED,
      message: `${DASHBOARD_ROUTE_MESSAGES.LOAD_FAILED} Reason: timeout`,
    });
    expect(dashboard_data_of(failed)).toEqual(EMPTY_DASHBOARD_DATA);
  });
});
