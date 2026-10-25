import { describe, expect, it } from "vitest";

import { list_concept_needs } from "./conceptGuideNeeds";
import { build_concept_progress } from "./conceptGuideProgress";

describe("concept needs checklist", () => {
  it("marks which prerequisites are in place and which are missing", () => {
    const progress = build_concept_progress({
      organization_count: 1,
      venue_count: 0,
      team_count: 2,
      player_count: 0,
      official_count: 0,
      competition_count: 1,
      competition_state: {
        status: "selected",
        progress: {
          name: "League",
          stage_count: 1,
          entered_team_count: 2,
          fixture_count: 0,
          open_fixture_count: 0,
          open_fixtures_with_setup: 0,
          open_fixtures_with_lineups: 0,
          live_count: 0,
          completed_count: 0,
        },
      },
    });

    expect(list_concept_needs("fixtures", progress)).toEqual([
      {
        concept_id: "entries",
        name: "Teams entered",
        reason: "Both teams must be entered in the competition.",
        route: "/competitions",
        is_met: true,
      },
      {
        concept_id: "venues",
        name: "Venues",
        reason: "The game is played at a venue.",
        route: "/venues",
        is_met: false,
      },
      {
        concept_id: "stages",
        name: "Stages",
        reason:
          "Each fixture belongs to a stage, so it counts in the right table.",
        route: "/competitions",
        is_met: true,
      },
    ]);
  });
});
