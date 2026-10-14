import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { build_match_report_data } from "./MatchReportBuilder";
import {
  make_basic_context,
  make_fixture,
} from "./MatchReportBuilder.test_support";

const ORIGINAL_TIME_ZONE = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/Los_Angeles";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TIME_ZONE;
});

describe("build_match_report_data date handling", () => {
  it("uses the scheduled calendar year for a new year's day fixture", () => {
    const context = {
      ...make_basic_context(),
      fixture: make_fixture({ scheduled_date: "2025-01-01" }),
    };
    const report = build_match_report_data(context);
    expect(report.fixture_year).toBe("2025");
    expect(report.date).toBe("1 JAN 2025");
  });
});
