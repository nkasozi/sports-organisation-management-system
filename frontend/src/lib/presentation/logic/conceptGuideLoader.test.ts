import { describe, expect, it } from "vitest";

import {
  type ConceptGuideSources,
  load_concept_guide_snapshot,
} from "./conceptGuideLoader";

function source(items: Record<string, unknown>[]): {
  list: (filter?: Record<string, unknown>) => Promise<unknown>;
} {
  return {
    list: async (filter: Record<string, unknown> = {}) => {
      const matching = items.filter((item) =>
        Object.entries(filter).every(([key, value]) => item[key] === value),
      );
      return {
        success: true as const,
        data: {
          items: matching,
          total_count: matching.length,
          page_number: 1,
          page_size: matching.length,
          total_pages: 1,
        },
      };
    },
  };
}

const ORG = "org_1";

function build_sources(): ConceptGuideSources {
  return {
    organizations: source([{ id: ORG, name: "Hockey Association" }]),
    venues: source([{ id: "v1", organization_id: ORG }]),
    teams: source([
      { id: "t1", organization_id: ORG },
      { id: "t2", organization_id: ORG },
      { id: "t3", organization_id: "other_org" },
    ]),
    players: source([{ id: "p1", organization_id: ORG }]),
    officials: source([]),
    competitions: source([{ id: "c1", name: "League", organization_id: ORG }]),
    stages: source([{ id: "s1", competition_id: "c1" }]),
    entries: source([
      { id: "e1", competition_id: "c1" },
      { id: "e2", competition_id: "c1" },
    ]),
    fixtures: source([
      {
        id: "f1",
        competition_id: "c1",
        status: "scheduled",
        home_team_id: "t1",
        away_team_id: "t2",
      },
      {
        id: "f2",
        competition_id: "c1",
        status: "scheduled",
        home_team_id: "t2",
        away_team_id: "t1",
      },
      {
        id: "f3",
        competition_id: "c1",
        status: "in_progress",
        home_team_id: "t1",
        away_team_id: "t2",
      },
      {
        id: "f4",
        competition_id: "c1",
        status: "completed",
        home_team_id: "t1",
        away_team_id: "t2",
      },
    ]),
    fixture_setups: source([
      { id: "d1", organization_id: ORG, fixture_id: "f1" },
    ]),
    lineups: source([
      { id: "l1", organization_id: ORG, fixture_id: "f1", team_id: "t1" },
      { id: "l2", organization_id: ORG, fixture_id: "f1", team_id: "t2" },
      { id: "l3", organization_id: ORG, fixture_id: "f2", team_id: "t2" },
    ]),
  } as unknown as ConceptGuideSources;
}

describe("concept guide loader", () => {
  it("counts the organization's data and how ready the competition's games are", async () => {
    const snapshot = await load_concept_guide_snapshot(build_sources(), ORG, {
      id: "c1",
      name: "League",
    });

    expect(snapshot).toEqual({
      organization_count: 1,
      venue_count: 1,
      team_count: 2,
      player_count: 1,
      official_count: 0,
      competition_count: 1,
      competition_state: {
        status: "selected",
        progress: {
          name: "League",
          stage_count: 1,
          entered_team_count: 2,
          fixture_count: 4,
          open_fixture_count: 2,
          open_fixtures_with_setup: 1,
          open_fixtures_with_lineups: 1,
          live_count: 1,
          completed_count: 1,
        },
      },
    });
  });

  it("reports no competition when none is chosen", async () => {
    const snapshot = await load_concept_guide_snapshot(
      build_sources(),
      ORG,
      false,
    );

    expect(snapshot.competition_state).toEqual({ status: "none" });
  });
});
