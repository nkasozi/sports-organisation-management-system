import { describe, expect, it, type Mock, vi } from "vitest";

import { NO_SCORE_AWARD } from "../entities/SportEventCatalog";
import { create_fixture_game_events } from "./FixtureGameEventsUseCases";
import { create_period_command } from "./FixtureUseCases.test_support";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn() },
}));

const GOAL_AWARD = {
  kind: "credit",
  points: 1,
  credited_side: "acting",
} as never;

type StoredFixture = Record<string, unknown> & { id: string };

function create_store(initial: StoredFixture): {
  find_by_id: Mock;
  update: Mock;
  current: () => StoredFixture;
} {
  let stored = initial;
  return {
    find_by_id: vi.fn(async () => ({ success: true, data: stored })),
    update: vi.fn(async (_id: string, updates: object) => {
      await Promise.resolve();
      stored = { ...stored, ...updates };
      return { success: true, data: stored };
    }),
    current: () => stored,
  };
}

function build_fixture(overrides: Record<string, unknown>): StoredFixture {
  return {
    id: "fx1",
    status: "in_progress",
    home_team_score: 0,
    away_team_score: 0,
    current_minute: 30,
    game_events: [],
    ...overrides,
  };
}

function build_event(id: string, minute: number): never {
  return { id, event_type: "goal", team_side: "home", minute } as never;
}

describe("fixture game event status guards", () => {
  it.each(["in_progress", "completed", "cancelled", "postponed"])(
    "refuses to restart a %s fixture without touching it",
    async (status) => {
      const store = create_store(build_fixture({ status }));
      const result = await create_fixture_game_events(
        store as never,
      ).start_fixture("fx1", "first_half");
      expect(result.success).toBe(false);
      expect(store.update).not.toHaveBeenCalled();
    },
  );

  it("starts a scheduled fixture in the sport's first playing period", async () => {
    const store = create_store(build_fixture({ status: "scheduled" }));
    const result = await create_fixture_game_events(
      store as never,
    ).start_fixture("fx1", "first_quarter");
    expect(result.success).toBe(true);
    expect(store.current()).toMatchObject({
      status: "in_progress",
      current_period: "first_quarter",
      current_minute: 0,
    });
  });

  it.each(["scheduled", "completed"])(
    "refuses to record events on a %s fixture",
    async (status) => {
      const store = create_store(build_fixture({ status }));
      const result = await create_fixture_game_events(
        store as never,
      ).record_game_event("fx1", build_event("e1", 10), GOAL_AWARD);
      expect(result.success).toBe(false);
      expect(store.update).not.toHaveBeenCalled();
    },
  );

  it.each(["scheduled", "completed"])(
    "refuses to end or change period of a %s fixture",
    async (status) => {
      const store = create_store(build_fixture({ status }));
      const use_cases = create_fixture_game_events(store as never);
      expect((await use_cases.end_fixture("fx1")).success).toBe(false);
      expect(
        (await use_cases.update_period("fx1", create_period_command())).success,
      ).toBe(false);
      expect(store.update).not.toHaveBeenCalled();
    },
  );
});

describe("recording game events safely", () => {
  it("never moves the current minute backwards", async () => {
    const store = create_store(build_fixture({ current_minute: 40 }));
    const result = await create_fixture_game_events(
      store as never,
    ).record_game_event("fx1", build_event("e1", 12), GOAL_AWARD);
    expect(result.success).toBe(true);
    expect(store.current().current_minute).toBe(40);
  });

  it("keeps both events and both goals when recorded concurrently", async () => {
    const store = create_store(build_fixture({}));
    const use_cases = create_fixture_game_events(store as never);
    await Promise.all([
      use_cases.record_game_event("fx1", build_event("e1", 31), GOAL_AWARD),
      use_cases.record_game_event("fx1", build_event("e2", 32), GOAL_AWARD),
    ]);
    expect(
      (store.current().game_events as { id: string }[]).map(
        (event) => event.id,
      ),
    ).toEqual(["e1", "e2"]);
    expect(store.current().home_team_score).toBe(2);
  });

  it("treats recording the same event twice as a no-op", async () => {
    const store = create_store(build_fixture({}));
    const use_cases = create_fixture_game_events(store as never);
    const first = await use_cases.record_game_event(
      "fx1",
      build_event("e1", 31),
      GOAL_AWARD,
    );
    expect(first.success).toBe(true);
    const repeat = await use_cases.record_game_event(
      "fx1",
      build_event("e1", 31),
      GOAL_AWARD,
    );
    expect(repeat.success).toBe(true);
    expect(store.update).toHaveBeenCalledTimes(1);
    expect(store.current().home_team_score).toBe(1);
  });

  it("records non-scoring events without changing the score", async () => {
    const store = create_store(build_fixture({}));
    const result = await create_fixture_game_events(
      store as never,
    ).record_game_event("fx1", build_event("e1", 31), NO_SCORE_AWARD);
    expect(result.success).toBe(true);
    expect(store.current().home_team_score).toBe(0);
  });
});
