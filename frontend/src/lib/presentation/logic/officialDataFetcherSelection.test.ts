import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  build_available_fixture_officials,
  collect_assigned_fixture_ids,
  collect_rated_ids,
  is_unrated_completed_assigned_fixture,
} from "./officialDataFetcherSelection";

function as_entities(items: Array<Record<string, unknown>>): BaseEntity[] {
  return items as unknown as BaseEntity[];
}

describe("officialDataFetcherSelection", () => {
  it("collects rated ids for the requested field", () => {
    const ratings = as_entities([
      { id: "rating-1", official_id: "official-1", fixture_id: "fixture-1" },
    ]);

    expect(collect_rated_ids(ratings, "official_id")).toEqual(
      new Set(["official-1"]),
    );
    expect(collect_rated_ids(ratings, "fixture_id")).toEqual(
      new Set(["fixture-1"]),
    );
  });

  it("collects fixtures whose setup assigns the official", () => {
    const setups = as_entities([
      { fixture_id: "fixture-1", assigned_officials: [{ official_id: "a" }] },
      { fixture_id: "fixture-2", assigned_officials: [{ official_id: "b" }] },
      { fixture_id: "fixture-3" },
    ]);

    expect(collect_assigned_fixture_ids(setups, "a")).toEqual(
      new Set(["fixture-1"]),
    );
  });

  it("accepts only completed, assigned and unrated fixtures", () => {
    const assigned = new Set(["fixture-1"]);
    const completed_fixture = as_entities([
      { id: "fixture-1", status: "completed" },
    ])[0];

    expect(
      is_unrated_completed_assigned_fixture(
        completed_fixture,
        assigned,
        new Set(),
      ),
    ).toBe(true);
    expect(
      is_unrated_completed_assigned_fixture(
        completed_fixture,
        assigned,
        new Set(["fixture-1"]),
      ),
    ).toBe(false);
  });

  it("labels assigned officials with their role and skips rated or unknown ones", () => {
    expect(
      build_available_fixture_officials(
        "fixture-1",
        {
          assigned_officials: [
            { official_id: "official-1", role_name: "Referee" },
            { official_id: "official-2", role_name: "Assistant" },
            { official_id: "official-3", role_name: "Fourth" },
          ],
        },
        as_entities([{ official_id: "official-2" }]),
        as_entities([
          { id: "official-1", first_name: "Ada" },
          { id: "official-2", first_name: "Bo", last_name: "Reed" },
        ]),
      ),
    ).toEqual([{ id: "official-1", first_name: "Ada", name: "Ada - Referee" }]);
  });

  it("returns no officials when the fixture has no assignments", () => {
    expect(build_available_fixture_officials("fixture-1", {}, [], [])).toEqual(
      [],
    );
  });
});
