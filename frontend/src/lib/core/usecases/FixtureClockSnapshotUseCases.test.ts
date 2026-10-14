import { describe, expect, it, vi } from "vitest";

import { BREAK_CLOCK_STATUS } from "../entities/FixtureClockSnapshot";
import { create_fixture_clock_use_cases } from "./FixtureClockUseCases";
import { create_keyed_serial_executor } from "./KeyedSerialExecutor";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn() },
}));

describe("save_clock_snapshot", () => {
  it("writes the game clock, added time and break start in one update", async () => {
    const repository = {
      update: vi.fn().mockResolvedValue({ success: true, data: { id: "fx1" } }),
    };
    const result = await create_fixture_clock_use_cases(
      repository as never,
      create_keyed_serial_executor(),
    ).save_clock_snapshot("fx1", {
      game_clock: { status: "stopped", elapsed_seconds: 2700 },
      added_seconds: 120,
      break_clock: {
        status: BREAK_CLOCK_STATUS.ON_BREAK,
        started_at: "2024-06-01T10:00:00.000Z" as never,
      },
    });
    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith("fx1", {
      clock_status: "stopped",
      clock_elapsed_seconds: 2700,
      clock_added_seconds: 120,
      clock_break_started_at: "2024-06-01T10:00:00.000Z",
    });
  });

  it("rejects a missing fixture id", async () => {
    const repository = { update: vi.fn() };
    const result = await create_fixture_clock_use_cases(
      repository as never,
      create_keyed_serial_executor(),
    ).save_clock_snapshot("", {
      game_clock: { status: "stopped", elapsed_seconds: 0 },
      added_seconds: 0,
      break_clock: { status: BREAK_CLOCK_STATUS.NOT_ON_BREAK },
    });
    expect(result.success).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
