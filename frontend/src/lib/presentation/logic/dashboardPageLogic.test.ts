import { describe, expect, it } from "vitest";

import {
  format_fixture_date,
  get_competition_initials,
  get_status_class,
  split_organization_name,
} from "./dashboardPageLogic";

describe("get_competition_initials", () => {
  it("returns first letter of each word uppercased", () => {
    expect(get_competition_initials("Premier League")).toBe("PL");
  });

  it("truncates to two characters", () => {
    expect(get_competition_initials("The Big Championship League")).toBe("TB");
  });

  it("handles single word", () => {
    expect(get_competition_initials("Cup")).toBe("C");
  });
});

describe("split_organization_name", () => {
  it("splits two-word name into prefix and suffix", () => {
    const result = split_organization_name("Field Hockey");
    expect(result).toEqual({
      prefix: "Field",
      suffix: "Hockey",
      remainder: "",
    });
  });

  it("handles single word name", () => {
    const result = split_organization_name("FIFA");
    expect(result).toEqual({ prefix: "", suffix: "FIFA", remainder: "" });
  });

  it("puts extra words into remainder", () => {
    const result = split_organization_name("United States Federation");
    expect(result).toEqual({
      prefix: "United",
      suffix: "States",
      remainder: "Federation",
    });
  });
});

describe("get_status_class", () => {
  it("returns status-active for active status", () => {
    expect(get_status_class("active")).toBe("status-active");
  });

  it("returns status-active for in_progress status", () => {
    expect(get_status_class("in_progress")).toBe("status-active");
  });

  it("returns status-warning for upcoming status", () => {
    expect(get_status_class("upcoming")).toBe("status-warning");
  });

  it("returns status-warning for scheduled status", () => {
    expect(get_status_class("scheduled")).toBe("status-warning");
  });

  it("returns status-inactive for completed status", () => {
    expect(get_status_class("completed")).toBe("status-inactive");
  });

  it("returns status-inactive for unknown status", () => {
    expect(get_status_class("unknown_value")).toBe("status-inactive");
  });
});

describe("format_fixture_date", () => {
  it("formats a regular date with time", () => {
    const far_future_date = "2099-06-15";
    const result = format_fixture_date(far_future_date, "14:00");
    expect(result).toContain("14:00");
    expect(result).toContain("Jun");
  });

  it("uses TBD when scheduled_time is empty", () => {
    const result = format_fixture_date("2099-06-15", "");
    expect(result).toContain("TBD");
  });
});
