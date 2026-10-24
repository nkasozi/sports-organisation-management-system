import { describe, expect, it } from "vitest";

import { to_iso_date } from "./fakeDataScenario";

describe("fake data dates follow the viewer's calendar", () => {
  it("keeps the local day just after midnight", () => {
    expect(to_iso_date(new Date(2026, 9, 25, 0, 30))).toBe("2026-10-25");
  });

  it("keeps the local day just before midnight", () => {
    expect(to_iso_date(new Date(2026, 0, 9, 23, 45))).toBe("2026-01-09");
  });
});
