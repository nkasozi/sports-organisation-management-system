import { describe, expect, it } from "vitest";

import { get_overtime_type_label } from "./overtimeTypeLabels";

describe("get_overtime_type_label", () => {
  it.each([
    ["extra_time", "Extra time"],
    ["golden_goal", "Golden goal"],
    ["silver_goal", "Silver goal"],
    ["penalties", "Penalty shootout"],
    ["replay", "Replay"],
    ["shootout", "Shootout"],
  ] as const)("shows %s as %s", (overtime_type, expected_label) => {
    expect(get_overtime_type_label(overtime_type)).toBe(expected_label);
  });
});
