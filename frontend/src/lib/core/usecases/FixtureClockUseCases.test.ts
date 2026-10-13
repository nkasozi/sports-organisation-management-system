import { describe, expect, it, vi } from "vitest";

import { FIXTURE_CLOCK_STATUS } from "../entities/FixtureClock";
import { create_fixture_clock_use_cases } from "./FixtureClockUseCases";
import { create_keyed_serial_executor } from "./KeyedSerialExecutor";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn() },
}));

function create_repository(update_result: object): {
  update: ReturnType<typeof vi.fn>;
} {
  return { update: vi.fn().mockResolvedValue(update_result) };
}

describe("save_clock_state", () => {
  it("saves a running clock with its start time", async () => {
    const repository = create_repository({
      success: true,
      data: { id: "fx1" },
    });
    const result = await create_fixture_clock_use_cases(
      repository as never,
      create_keyed_serial_executor(),
    ).save_clock_state("fx1", {
      status: FIXTURE_CLOCK_STATUS.RUNNING,
      elapsed_seconds: 90,
      started_at: "2024-06-01T10:00:00.000Z",
    } as never);

    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledWith("fx1", {
      clock_status: "running",
      clock_elapsed_seconds: 90,
      clock_started_at: "2024-06-01T10:00:00.000Z",
    });
  });

  it("returns a failure when the fixture id is missing", async () => {
    const repository = create_repository({ success: true, data: {} });
    const result = await create_fixture_clock_use_cases(
      repository as never,
      create_keyed_serial_executor(),
    ).save_clock_state("", {
      status: FIXTURE_CLOCK_STATUS.STOPPED,
      elapsed_seconds: 0,
    });

    expect(result.success).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("returns the repository failure when saving fails", async () => {
    const repository = create_repository({ success: false, error: "offline" });
    const result = await create_fixture_clock_use_cases(
      repository as never,
      create_keyed_serial_executor(),
    ).save_clock_state("fx1", {
      status: FIXTURE_CLOCK_STATUS.STOPPED,
      elapsed_seconds: 12,
    });

    expect(result.success).toBe(false);
  });
});
