import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import type { GameEvent } from "../entities/Fixture";
import { create_fixture_game_events } from "./FixtureGameEventsUseCases";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn() },
}));

const REGULATION = ["first_half", "half_time", "second_half"];
const WITH_EXTRA_TIME = [
  ...REGULATION,
  "extra_time_first",
  "extra_time_second",
];

function period_event(id: string, event_type: string): GameEvent {
  return {
    id,
    event_type,
    minute: 45,
    stoppage_time_minute: 0,
    team_side: "match",
    player_name: "",
    secondary_player_name: "",
    description: "",
    recorded_at: "2024-06-15T15:45:00.000Z",
  } as unknown as GameEvent;
}

type RepositoryDouble = { find_by_id: Mock; update: Mock };

function repository_with(fixture: Record<string, unknown>): RepositoryDouble {
  return {
    find_by_id: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: "fx1",
        status: "in_progress",
        current_minute: 40,
        ...fixture,
      },
    }),
    update: vi.fn((id: string, updates: object) =>
      Promise.resolve({ success: true, data: { ...fixture, ...updates, id } }),
    ),
  };
}

describe("update_period", () => {
  let repository: RepositoryDouble;

  beforeEach(() => {
    repository = repository_with({
      current_period: "first_half",
      game_events: [],
    });
  });

  function change(
    command: Partial<
      Parameters<
        ReturnType<typeof create_fixture_game_events>["update_period"]
      >[1]
    >,
  ): ReturnType<
    ReturnType<typeof create_fixture_game_events>["update_period"]
  > {
    return create_fixture_game_events(repository as never).update_period(
      "fx1",
      {
        expected_current_period: "first_half",
        next_period: "half_time",
        minute: 45,
        period_sequence: REGULATION,
        period_event: period_event("end-1", "period_end"),
        ...command,
      },
    );
  }

  it("moves to the next period and records the end event against the period that ended", async () => {
    const result = await change({});
    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith("fx1", {
      current_period: "half_time",
      current_minute: 45,
      game_events: [
        expect.objectContaining({ id: "end-1", period_id: "first_half" }),
      ],
    });
  });

  it("records a start event against the period that starts", async () => {
    repository = repository_with({
      current_period: "half_time",
      game_events: [],
    });
    const result = await change({
      expected_current_period: "half_time",
      next_period: "second_half",
      period_event: period_event("start-2", "period_start"),
    });
    expect(result.success).toBe(true);
    expect(repository.update.mock.calls[0][1].game_events[0]).toMatchObject({
      id: "start-2",
      period_id: "second_half",
    });
  });

  it("rejects a change made from a stale view of the current period", async () => {
    repository = repository_with({
      current_period: "second_half",
      game_events: [],
    });
    const result = await change({});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/refresh/i);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rejects moving backwards in the sport's period order", async () => {
    repository = repository_with({
      current_period: "second_half",
      game_events: [],
    });
    const result = await change({
      expected_current_period: "second_half",
      next_period: "first_half",
    });
    expect(result.success).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rejects a period the sport does not have", async () => {
    const result = await change({ next_period: "fourth_quarter" });
    expect(result.success).toBe(false);
  });

  it("treats a repeated period event as already applied", async () => {
    repository = repository_with({
      current_period: "half_time",
      game_events: [period_event("end-1", "period_end")],
    });
    const result = await change({});
    expect(result.success).toBe(true);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("allows finishing the game from any playing period", async () => {
    repository = repository_with({
      current_period: "second_half",
      game_events: [],
    });
    const result = await change({
      expected_current_period: "second_half",
      next_period: "finished",
    });
    expect(result.success).toBe(true);
  });

  it("allows starting extra time after regulation has finished", async () => {
    repository = repository_with({
      current_period: "finished",
      game_events: [
        { ...period_event("end-2", "period_end"), period_id: "second_half" },
      ],
    });
    const result = await change({
      expected_current_period: "finished",
      next_period: "extra_time_first",
      period_sequence: WITH_EXTRA_TIME,
      period_event: period_event("start-et", "period_start"),
    });
    expect(result.success).toBe(true);
  });

  it("refuses to restart a period that was already played after the game finished", async () => {
    repository = repository_with({
      current_period: "finished",
      game_events: [
        { ...period_event("end-2", "period_end"), period_id: "second_half" },
      ],
    });
    const result = await change({
      expected_current_period: "finished",
      next_period: "second_half",
      period_event: period_event("start-again", "period_start"),
    });
    expect(result.success).toBe(false);
  });
});
