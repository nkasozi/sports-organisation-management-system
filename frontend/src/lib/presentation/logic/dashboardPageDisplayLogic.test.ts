import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  format_fixture_date,
  get_competition_initials,
  get_status_class,
  split_organization_name,
} from "./dashboardPageDisplayLogic";

describe("dashboardPageDisplayLogic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T08:00:00.000Z"));
  });

  it("derives competition initials and splits organization names", () => {
    expect(get_competition_initials("Uganda Cup")).toBe("UC");
    expect(split_organization_name("Uganda Hockey Association")).toEqual({
      prefix: "Uganda",
      suffix: "Hockey",
      remainder: "Association",
    });
    expect(split_organization_name("Hockey")).toEqual({
      prefix: "",
      suffix: "Hockey",
      remainder: "",
    });
  });

  it("maps statuses and formats today, tomorrow, and later fixtures", () => {
    expect(get_status_class("active")).toBe("status-active");
    expect(get_status_class("scheduled")).toBe("status-warning");
    expect(get_status_class("finished")).toBe("status-inactive");

    expect(format_fixture_date("2026-04-08", "10:00")).toBe("Today, 10:00");
    expect(format_fixture_date("2026-04-09", "")).toBe("Tomorrow, TBD");
    expect(format_fixture_date("2026-04-12", "14:00")).toContain("14:00");
  });
});
