import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { OptionStatus } from "../types/Option";
import {
  compare_local_calendar_dates,
  format_local_calendar_date_key,
  is_local_calendar_date_before,
  parse_local_calendar_date,
  read_local_calendar_date_key,
} from "./LocalCalendarDate";

const ORIGINAL_TIME_ZONE = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/New_York";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TIME_ZONE;
});

describe("parse_local_calendar_date", () => {
  it("parses a date-only value as local midnight of that calendar day", () => {
    const parsed = parse_local_calendar_date("2024-01-06");
    expect(parsed.status).toBe(OptionStatus.SOME);
    if (parsed.status !== OptionStatus.SOME) return;
    expect(parsed.value.getFullYear()).toBe(2024);
    expect(parsed.value.getMonth()).toBe(0);
    expect(parsed.value.getDate()).toBe(6);
    expect(parsed.value.getHours()).toBe(0);
  });

  it("uses only the calendar date part of a full timestamp", () => {
    const parsed = parse_local_calendar_date("2024-01-06T00:00:00.000Z");
    expect(parsed.status === OptionStatus.SOME && parsed.value.getDate()).toBe(
      6,
    );
  });

  it.each(["", "not a date", "2024-13-01", "2024-02-30", "24-01-06"])(
    "returns none for the invalid value %j",
    (value) => {
      expect(parse_local_calendar_date(value).status).toBe(OptionStatus.NONE);
    },
  );
});

describe("format_local_calendar_date_key", () => {
  it("formats using the local calendar day, not the UTC day", () => {
    const late_evening_local = new Date(2024, 0, 6, 23, 30);
    expect(format_local_calendar_date_key(late_evening_local)).toBe(
      "2024-01-06",
    );
  });
});

describe("read_local_calendar_date_key", () => {
  it("normalises a timestamp to its date key", () => {
    const key = read_local_calendar_date_key(" 2024-03-09T10:00:00Z ");
    expect(key).toEqual({ status: OptionStatus.SOME, value: "2024-03-09" });
  });
});

describe("compare_local_calendar_dates", () => {
  it("orders calendar days", () => {
    expect(compare_local_calendar_dates("2024-01-05", "2024-01-06")).toBe(-1);
    expect(compare_local_calendar_dates("2024-01-06", "2024-01-06")).toBe(0);
    expect(compare_local_calendar_dates("2024-02-01", "2024-01-06")).toBe(1);
  });
});

describe("is_local_calendar_date_before", () => {
  it("treats the whole local day as not yet passed", () => {
    const late_evening = new Date(2024, 0, 6, 23, 59);
    expect(is_local_calendar_date_before("2024-01-06", late_evening)).toBe(
      false,
    );
    expect(is_local_calendar_date_before("2024-01-05", late_evening)).toBe(
      true,
    );
  });

  it("returns false for an unreadable date", () => {
    expect(is_local_calendar_date_before("soon", new Date())).toBe(false);
  });
});
