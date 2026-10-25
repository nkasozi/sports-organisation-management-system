import { describe, expect, it } from "vitest";

import type { ConceptGuideSources } from "./conceptGuideLoader";
import { find_next_concept_step } from "./conceptGuideNextStep";
import {
  find_concept_for_entity_type,
  load_default_concept_snapshot,
} from "./conceptGuideOverview";

async function load_default_concept_next_step(
  sources: ConceptGuideSources,
  preferred_organization_id: string,
): Promise<ReturnType<typeof find_next_concept_step>> {
  return find_next_concept_step(
    await load_default_concept_snapshot(sources, preferred_organization_id),
  );
}

function source(items: Record<string, unknown>[]): {
  list: (filter?: Record<string, unknown>) => Promise<unknown>;
} {
  return {
    list: async (filter: Record<string, unknown> = {}) => {
      const matching = items.filter((item) =>
        Object.entries(filter).every(([key, value]) => item[key] === value),
      );
      return { success: true, data: { items: matching } };
    },
  };
}

function build_sources(
  overrides: Partial<Record<keyof ConceptGuideSources, unknown>>,
): ConceptGuideSources {
  const empty = source([]);
  return {
    organizations: empty,
    venues: empty,
    teams: empty,
    players: empty,
    officials: empty,
    competitions: empty,
    stages: empty,
    entries: empty,
    fixtures: empty,
    fixture_setups: empty,
    lineups: empty,
    ...overrides,
  } as unknown as ConceptGuideSources;
}

describe("default concept next step", () => {
  it("tells a brand new user to create their organization", async () => {
    const next_step = await load_default_concept_next_step(
      build_sources({}),
      "",
    );

    expect(next_step.concept_id).toBe("organization");
  });

  it("uses the user's own organization and its running competition", async () => {
    const sources = build_sources({
      organizations: source([
        { id: "org_a", name: "Netball League" },
        { id: "org_b", name: "Hockey Association" },
      ]),
      venues: source([{ id: "v1", organization_id: "org_b" }]),
      teams: source([
        { id: "t1", organization_id: "org_b" },
        { id: "t2", organization_id: "org_b" },
      ]),
      players: source([{ id: "p1", organization_id: "org_b" }]),
      officials: source([{ id: "o1", organization_id: "org_b" }]),
      competitions: source([
        {
          id: "c1",
          name: "Hockey League",
          organization_id: "org_b",
          start_date: "2020-01-01",
          end_date: "2099-12-31",
        },
      ]),
      stages: source([{ id: "s1", competition_id: "c1" }]),
      entries: source([{ id: "e1", competition_id: "c1" }]),
    });

    const next_step = await load_default_concept_next_step(sources, "org_b");

    expect(next_step).toMatchObject({
      concept_id: "entries",
      message:
        "Enter at least 2 teams into Hockey League to schedule fixtures.",
    });
  });

  it("matches each saved record type to the concept it belongs to", () => {
    expect(find_concept_for_entity_type("Team")).toBe("teams");
    expect(find_concept_for_entity_type("FixtureDetailsSetup")).toBe(
      "fixture_setup",
    );
    expect(find_concept_for_entity_type("player_team_membership")).toBe(
      "players",
    );
    expect(find_concept_for_entity_type("GameEventType")).toBe(false);
  });
});
