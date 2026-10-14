import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { format_report_date } from "../types/MatchReportTypes";
import { OptionStatus } from "../types/Option";
import { derive_competition_status } from "./CompetitionHelpers";
import {
  get_days_until_expiry,
  is_qualification_expired,
} from "./Qualification";

const ORIGINAL_TIME_ZONE = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/Los_Angeles";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TIME_ZONE;
});

describe("date-only values compared as local calendar dates", () => {
  it("keeps a qualification valid for the whole of its expiry day", () => {
    const late_on_expiry_day = new Date(2024, 4, 10, 22, 0);
    expect(is_qualification_expired("2024-05-10", late_on_expiry_day)).toBe(
      false,
    );
    expect(
      is_qualification_expired("2024-05-10", new Date(2024, 4, 11, 0, 5)),
    ).toBe(true);
  });

  it("counts days until expiry on the local calendar", () => {
    const result = get_days_until_expiry(
      "2024-05-12",
      new Date(2024, 4, 10, 23),
    );
    expect(result).toEqual({ status: OptionStatus.SOME, value: 2 });
  });

  it("treats a competition as active on its local start day evening", () => {
    const evening_of_start = new Date(2024, 5, 1, 20, 0);
    expect(
      derive_competition_status("2024-06-01", "2024-06-30", evening_of_start),
    ).toBe("active");
  });

  it("treats a competition as active for the whole of its local end day", () => {
    const evening_of_end = new Date(2024, 5, 30, 20, 0);
    expect(
      derive_competition_status("2024-06-01", "2024-06-30", evening_of_end),
    ).toBe("active");
    expect(
      derive_competition_status(
        "2024-06-01",
        "2024-06-30",
        new Date(2024, 6, 1, 0, 30),
      ),
    ).toBe("completed");
  });

  it("formats the report date on the scheduled calendar day", () => {
    expect(format_report_date("2024-03-14")).toBe("14 MAR 2024");
  });
});
