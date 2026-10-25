import { describe, expect, it } from "vitest";

import { find_next_concept_step } from "./conceptGuideNextStep";
import { build_concept_progress } from "./conceptGuideProgress";
import type {
  CompetitionProgress,
  ConceptGuideSnapshot,
} from "./conceptGuideTypes";

const EMPTY: ConceptGuideSnapshot = {
  organization_count: 0,
  venue_count: 0,
  team_count: 0,
  player_count: 0,
  official_count: 0,
  competition_count: 0,
  competition_state: { status: "none" },
};

function with_competition(
  snapshot: Partial<ConceptGuideSnapshot>,
  progress: Partial<CompetitionProgress>,
): ConceptGuideSnapshot {
  return {
    ...EMPTY,
    organization_count: 1,
    venue_count: 2,
    team_count: 4,
    player_count: 40,
    official_count: 3,
    competition_count: 1,
    ...snapshot,
    competition_state: {
      status: "selected",
      progress: {
        name: "Premier League",
        stage_count: 1,
        entered_team_count: 4,
        fixture_count: 0,
        open_fixture_count: 0,
        open_fixtures_with_setup: 0,
        open_fixtures_with_lineups: 0,
        live_count: 0,
        completed_count: 0,
        ...progress,
      },
    },
  };
}

describe("concept guide progress", () => {
  it("starts a brand new user at the organization, with everything else locked", () => {
    const progress = build_concept_progress(EMPTY);

    expect(progress.organization.status).toBe("todo");
    expect(progress.teams).toEqual({
      status: "locked",
      detail: "Needs Organization",
    });
    expect(progress.fixtures.status).toBe("locked");
    expect(find_next_concept_step(EMPTY)).toMatchObject({
      concept_id: "organization",
      action_label: "Create organization",
    });
  });

  it("asks for a second team before fixtures can be made", () => {
    const snapshot = with_competition({}, { entered_team_count: 1 });
    const progress = build_concept_progress(snapshot);

    expect(progress.entries).toEqual({ status: "todo", detail: "1 team" });
    expect(progress.fixtures).toEqual({
      status: "locked",
      detail: "Needs 2 teams entered",
    });
    expect(find_next_concept_step(snapshot)).toMatchObject({
      concept_id: "entries",
      message:
        "Enter at least 2 teams into Premier League to schedule fixtures.",
    });
  });

  it("points at upcoming games that still need officials or lineups", () => {
    const snapshot = with_competition(
      {},
      {
        fixture_count: 4,
        open_fixture_count: 3,
        open_fixtures_with_setup: 1,
        open_fixtures_with_lineups: 3,
        completed_count: 1,
      },
    );
    const progress = build_concept_progress(snapshot);

    expect(progress.fixture_setup).toEqual({
      status: "todo",
      detail: "1 of 3 games ready",
    });
    expect(progress.lineups).toEqual({
      status: "done",
      detail: "3 of 3 games ready",
    });
    expect(progress.results).toEqual({ status: "done", detail: "1 played" });
    expect(find_next_concept_step(snapshot)).toMatchObject({
      concept_id: "fixture_setup",
      message:
        "2 upcoming games in Premier League still need officials and jerseys.",
    });
  });

  it("asks for a competition when the organization is ready but has none", () => {
    const snapshot = { ...with_competition({}, {}), competition_count: 0 };
    snapshot.competition_state = { status: "none" };

    expect(build_concept_progress(snapshot).stages).toEqual({
      status: "locked",
      detail: "Needs Competition",
    });
    expect(find_next_concept_step(snapshot).concept_id).toBe("competition");
  });

  it("has nothing left to do once every game is ready", () => {
    const snapshot = with_competition(
      {},
      { fixture_count: 2, live_count: 1, completed_count: 1 },
    );

    expect(build_concept_progress(snapshot).live_game).toEqual({
      status: "done",
      detail: "1 live now",
    });
    expect(find_next_concept_step(snapshot)).toMatchObject({
      concept_id: "live_game",
      action_label: "Watch live games",
    });
  });
});
