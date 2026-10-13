import { describe, expect, it, vi } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import { find_fixture_venue } from "./fixtureVenueLookup";

const LUGOGO = { id: "venue-1", name: "Lugogo Hockey Stadium" };
const LUGOGO_ANNEX = { id: "venue-2", name: "Lugogo Hockey Stadium Annex" };

function create_venue_use_cases(venues: object[]): {
  list: ReturnType<typeof vi.fn>;
} {
  return {
    list: vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: venues,
        total_count: venues.length,
        page_number: 1,
        page_size: 10,
        total_pages: 1,
      },
    }),
  };
}

describe("find_fixture_venue", () => {
  it("finds the venue whose name matches the fixture's venue exactly", async () => {
    const venue_use_cases = create_venue_use_cases([LUGOGO_ANNEX, LUGOGO]);

    const venue = await find_fixture_venue(
      "lugogo hockey stadium",
      venue_use_cases as never,
    );

    expect(venue).toEqual({ status: OptionStatus.SOME, value: LUGOGO });
    expect(venue_use_cases.list).toHaveBeenCalledWith(
      { name_contains: "lugogo hockey stadium" },
      expect.any(Object),
    );
  });

  it("returns no venue for a blank venue or an unknown name", async () => {
    const venue_use_cases = create_venue_use_cases([LUGOGO_ANNEX]);

    expect(
      (await find_fixture_venue("", venue_use_cases as never)).status,
    ).toBe(OptionStatus.NONE);
    expect(
      (
        await find_fixture_venue(
          "Lugogo Hockey Stadium",
          venue_use_cases as never,
        )
      ).status,
    ).toBe(OptionStatus.NONE);
  });
});
