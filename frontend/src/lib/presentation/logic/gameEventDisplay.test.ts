import { describe, expect, it } from "vitest";

import { get_event_bg_class } from "./gameEventDisplay";

describe("get_event_bg_class", () => {
  it("maps period events to the purple timeline styling", () => {
    expect(get_event_bg_class("period_start")).toContain("border-l-purple-500");
  });

  it("uses neutral styling for events a sport defines itself", () => {
    expect(get_event_bg_class("centre_pass")).toBe(
      "border-l-gray-300 bg-gray-50 dark:bg-accent-800",
    );
  });
});
