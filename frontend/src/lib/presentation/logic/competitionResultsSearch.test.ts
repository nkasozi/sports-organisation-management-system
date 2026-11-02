import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";

import {
  build_completed_results_page,
  filter_completed_results,
  sort_completed_results_by_kickoff,
} from "./competitionResultsSearch";
import { STAGE_ORDER } from "./competitionStageOrder";

const TEAM_NAMES: Record<string, string> = {
  team_rockets: "Rockets",
  team_originals: "KHC Originals",
  team_wabalozi: "WSC Wabalozi",
};

const STAGE_NAMES: Record<string, string> = {
  stage_semis: "Semi Finals",
  stage_round_of_16: "Round of 16",
};

function build_fixture(
  id: string,
  home_team_id: string,
  away_team_id: string,
  stage_id: string,
  scheduled_date: string,
): Fixture {
  return {
    id,
    home_team_id,
    away_team_id,
    stage_id,
    scheduled_date,
    scheduled_time: "13:00",
  } as Fixture;
}

const semi_final = build_fixture(
  "fixture_semi",
  "team_originals",
  "team_rockets",
  "stage_semis",
  "2026-05-02",
);
const round_of_16 = build_fixture(
  "fixture_r16",
  "team_rockets",
  "team_wabalozi",
  "stage_round_of_16",
  "2026-04-25",
);
const all_fixtures = [semi_final, round_of_16];

function search(search_query: string): Fixture[] {
  return filter_completed_results({
    fixtures: all_fixtures,
    search_query,
    get_team_name: (team_id: string) => TEAM_NAMES[team_id],
    get_stage_name: (stage_id: string) => STAGE_NAMES[stage_id],
    get_stage_type: () => "Knockout Stage",
    format_date: (date_string: string) => `formatted ${date_string}`,
  });
}

describe("filter_completed_results", () => {
  it("returns every fixture for an empty or blank query", () => {
    expect(search("")).toEqual(all_fixtures);
    expect(search("   ")).toEqual(all_fixtures);
  });

  it("matches either the home or the away team, ignoring case", () => {
    expect(search("rockets")).toEqual(all_fixtures);
    expect(search("WABALOZI")).toEqual([round_of_16]);
    expect(search("khc")).toEqual([semi_final]);
  });

  it("matches the stage name", () => {
    expect(search("semi")).toEqual([semi_final]);
  });

  it("matches the raw scheduled date and the formatted date", () => {
    expect(search("2026-04-25")).toEqual([round_of_16]);
    expect(search("formatted 2026-05-02")).toEqual([semi_final]);
  });

  it("requires every search term to match somewhere in the fixture", () => {
    expect(search("rockets semi")).toEqual([semi_final]);
    expect(search("wabalozi semi")).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(search("nonexistent team")).toEqual([]);
  });
});

describe("build_completed_results_page", () => {
  const fixtures = Array.from({ length: 12 }, (_, index) =>
    build_fixture(`fixture_${index}`, "a", "b", "s", "2026-01-01"),
  );

  it("slices the requested page and counts the pages", () => {
    const page = build_completed_results_page({
      fixtures,
      page_number: 2,
      items_per_page: 5,
    });

    expect(page.total_pages).toBe(3);
    expect(page.page_fixtures.map((fixture) => fixture.id)).toEqual([
      "fixture_5",
      "fixture_6",
      "fixture_7",
      "fixture_8",
      "fixture_9",
    ]);
  });

  it("reports a single page when there are no fixtures", () => {
    const page = build_completed_results_page({
      fixtures: [],
      page_number: 1,
      items_per_page: 10,
    });

    expect(page.total_pages).toBe(1);
    expect(page.page_fixtures).toEqual([]);
  });
});

describe("sort_completed_results_by_kickoff", () => {
  const april = build_fixture("april", "a", "b", "s", "2026-04-25");
  const may = build_fixture("may", "a", "b", "s", "2026-05-02");
  const march = build_fixture("march", "a", "b", "s", "2026-03-10");
  const undated = build_fixture("undated", "a", "b", "s", "");

  it("puts the latest match first when descending", () => {
    expect(
      sort_completed_results_by_kickoff(
        [april, undated, march, may],
        STAGE_ORDER.DESCENDING,
      ).map((fixture) => fixture.id),
    ).toEqual(["may", "april", "march", "undated"]);
  });

  it("puts the earliest match first when ascending, undated still last", () => {
    expect(
      sort_completed_results_by_kickoff(
        [april, undated, may, march],
        STAGE_ORDER.ASCENDING,
      ).map((fixture) => fixture.id),
    ).toEqual(["march", "april", "may", "undated"]);
  });
});
