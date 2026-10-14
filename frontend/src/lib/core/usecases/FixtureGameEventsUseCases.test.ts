import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import {
  create_score_award_resolver,
  NO_SCORE_AWARD,
} from "../entities/SportEventCatalog";
import { create_fixture_game_events } from "./FixtureGameEventsUseCases";
import { create_period_command } from "./FixtureUseCases.test_support";

const LEGACY_SCORING = create_score_award_resolver([]);

const mocks = vi.hoisted(() => ({ emit_entity_updated: vi.fn() }));

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: mocks.emit_entity_updated },
}));

const FIXTURE = {
  id: "fx1",
  status: "in_progress",
  current_minute: 0,
  venue: "Arena",
  round_number: 3,
  home_team_score: 1,
  away_team_score: 2,
  game_events: [{ event_type: "goal" }],
};

interface FixtureRepositoryDouble {
  find_by_id: Mock;
  update: Mock;
}

function create_repository(
  found: unknown = { success: true, data: FIXTURE },
): FixtureRepositoryDouble {
  return {
    find_by_id: vi.fn().mockResolvedValue(found),
    update: vi.fn((id: string, updates: object) =>
      Promise.resolve({ success: true, data: { ...FIXTURE, ...updates, id } }),
    ),
  };
}

const MISSING = { success: false, error: "missing" };

describe("create_fixture_game_events", () => {
  beforeEach(() => {
    mocks.emit_entity_updated.mockReset();
  });

  it("refuses live changes when the fixture cannot be found", async () => {
    const repository = create_repository(MISSING);
    const use_cases = create_fixture_game_events(repository as never);

    expect((await use_cases.start_fixture("fx1", "first_half")).success).toBe(
      false,
    );
    expect(
      (await use_cases.update_period("fx1", create_period_command())).success,
    ).toBe(false);

    expect(repository.update).not.toHaveBeenCalled();
    expect(mocks.emit_entity_updated).not.toHaveBeenCalled();
  });

  it("starts fixtures with reset scores and the first half", async () => {
    const repository = create_repository({
      success: true,
      data: { ...FIXTURE, status: "scheduled" },
    });

    expect(
      (
        await create_fixture_game_events(repository as never).start_fixture(
          "fx1",
          "first_half",
        )
      ).success,
    ).toBe(true);

    expect(repository.update).toHaveBeenCalledWith("fx1", {
      status: "in_progress",
      current_period: "first_half",
      current_minute: 0,
      home_team_score: 0,
      away_team_score: 0,
      game_events: [],
    });
    expect(mocks.emit_entity_updated.mock.calls[0][5]).toEqual([
      "status",
      "current_period",
      "current_minute",
      "home_team_score",
      "away_team_score",
      "game_events",
    ]);
  });

  it.each([
    ["penalty_scored", "away", 1, 3],
    ["own_goal", "home", 1, 3],
    ["own_goal", "away", 2, 2],
    ["yellow_card", "home", 1, 2],
  ])("records %s for %s side", async (event_type, team_side, home, away) => {
    const repository = create_repository();
    const event = { id: "new", event_type, team_side, minute: 12 };
    const use_cases = create_fixture_game_events(repository as never);
    const award = LEGACY_SCORING(event_type);
    const result = await use_cases.record_game_event(
      "fx1",
      event as never,
      award,
    );
    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledWith("fx1", {
      game_events: [...FIXTURE.game_events, expect.objectContaining(event)],
      home_team_score: home,
      away_team_score: away,
      current_minute: 12,
    });
  });

  it("fails to record events or end unknown fixtures", async () => {
    const use_cases = create_fixture_game_events(
      create_repository(MISSING) as never,
    );
    const not_found = { success: false, error: "Fixture not found" };

    expect(
      await use_cases.record_game_event("fx1", {} as never, NO_SCORE_AWARD),
    ).toEqual(not_found);
    expect(await use_cases.end_fixture("fx1")).toEqual(not_found);
    expect(await use_cases.end_fixture(" ")).toEqual({
      success: false,
      error: "Fixture ID is required",
    });
  });

  it("ends fixtures keeping scores and defaulting missing scores", async () => {
    const repository = create_repository({
      success: true,
      data: {
        ...FIXTURE,
        home_team_score: undefined,
        venue: "",
        round_number: 0,
      },
    });

    repository.update.mockResolvedValue({
      success: true,
      data: { id: "fx1", venue: "", round_number: 0 } as never,
    });

    expect(
      (await create_fixture_game_events(repository as never).end_fixture("fx1"))
        .success,
    ).toBe(true);

    expect(repository.update).toHaveBeenCalledWith("fx1", {
      status: "completed",
      current_period: "finished",
      home_team_score: 0,
      away_team_score: 2,
    });
    expect(mocks.emit_entity_updated.mock.calls[0][2]).toBe("Fixture - Round");
  });
});
