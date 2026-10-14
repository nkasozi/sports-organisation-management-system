import { describe, expect, it, type Mock, vi } from "vitest";

import type { GameEvent } from "../entities/Fixture";
import {
  create_score_award_resolver,
  NO_SCORE_AWARD,
} from "../entities/SportEventCatalog";
import { create_fixture_game_events } from "./FixtureGameEventsUseCases";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn() },
}));

const GOAL_AWARD = create_score_award_resolver([
  { event_type: "goal", points_awarded: 1 },
])("goal");

type RepositoryDouble = { find_by_id: Mock; update: Mock };

function repository_with(fixture: Record<string, unknown>): RepositoryDouble {
  const stored = {
    id: "fx1",
    status: "in_progress",
    current_minute: 40,
    home_team_score: 1,
    away_team_score: 0,
    game_events: [],
    ...fixture,
  };
  return {
    find_by_id: vi.fn().mockResolvedValue({ success: true, data: stored }),
    update: vi.fn((id: string, updates: object) =>
      Promise.resolve({ success: true, data: { ...stored, ...updates, id } }),
    ),
  };
}

function event(
  overrides: Partial<Record<keyof GameEvent, unknown>>,
): GameEvent {
  return {
    id: "e1",
    event_type: "goal",
    minute: 44,
    stoppage_time_minute: 0,
    team_side: "home",
    player_name: "",
    secondary_player_name: "",
    description: "",
    recorded_at: "2024-06-15T15:44:00.000Z",
    ...overrides,
  } as unknown as GameEvent;
}

describe("record_game_event period attribution", () => {
  it("keeps the period the event was attributed to", async () => {
    const repository = repository_with({ current_period: "half_time" });
    const result = await create_fixture_game_events(
      repository as never,
    ).record_game_event(
      "fx1",
      event({ period_id: "first_half" }),
      NO_SCORE_AWARD,
    );
    expect(result.success).toBe(true);
    expect(repository.update.mock.calls[0][1].game_events[0]).toMatchObject({
      period_id: "first_half",
    });
  });

  it("stamps the current period when the event has none", async () => {
    const repository = repository_with({ current_period: "second_half" });
    const result = await create_fixture_game_events(
      repository as never,
    ).record_game_event("fx1", event({}), NO_SCORE_AWARD);
    expect(result.success).toBe(true);
    expect(repository.update.mock.calls[0][1].game_events[0]).toMatchObject({
      period_id: "second_half",
    });
  });
});

describe("record_game_event during a penalty shootout", () => {
  it("adds the kick to the shootout tally instead of the match score", async () => {
    const repository = repository_with({
      current_period: "penalty_shootout",
      shootout_home_score: 2,
    });
    const result = await create_fixture_game_events(
      repository as never,
    ).record_game_event("fx1", event({}), GOAL_AWARD);
    expect(result.success).toBe(true);
    const updates = repository.update.mock.calls[0][1];
    expect(updates).toMatchObject({
      shootout_home_score: 3,
      shootout_away_score: 0,
    });
    expect(updates).not.toHaveProperty("home_team_score");
    expect(updates).not.toHaveProperty("away_team_score");
  });
});
