import { describe, expect, it, vi } from "vitest";

import {
  change_game_period,
  end_game_period,
  end_game_session,
  start_game_session,
} from "./gameManageActions";

describe("gameManageActions", () => {
  it("delegates start and end session requests to the fixture use cases", async () => {
    const fixture_use_cases = {
      start_fixture: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
      end_fixture: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
    };

    await expect(
      start_game_session(
        "fixture-1",
        fixture_use_cases as never,
        "first_quarter",
      ),
    ).resolves.toEqual({
      success: true,
      data: { id: "fixture-1" },
    });
    await expect(
      end_game_session("fixture-1", fixture_use_cases as never),
    ).resolves.toEqual({
      success: true,
      data: { id: "fixture-1" },
    });
    expect(fixture_use_cases.start_fixture).toHaveBeenCalledWith(
      "fixture-1",
      "first_quarter",
    );
  });

  it("starts the next period and records its start event in one write", async () => {
    const fixture_use_cases = {
      record_game_event: vi.fn(),
      update_period: vi.fn().mockResolvedValue({
        success: true,
        data: { id: "fixture-1", current_period: "second_half" },
      }),
    };

    const result = await change_game_period({
      fixture: { id: "fixture-1", current_period: "half_time" } as never,
      new_period: "second_half",
      new_period_label: "2nd Half",
      minute: 45,
      period_sequence: ["first_half", "half_time", "second_half"],
      fixture_use_cases: fixture_use_cases as never,
    });

    expect(result.success).toBe(true);
    expect(fixture_use_cases.record_game_event).not.toHaveBeenCalled();
    expect(fixture_use_cases.update_period).toHaveBeenCalledTimes(1);
    expect(fixture_use_cases.update_period).toHaveBeenCalledWith("fixture-1", {
      expected_current_period: "half_time",
      next_period: "second_half",
      minute: 45,
      period_sequence: ["first_half", "half_time", "second_half"],
      period_event: expect.objectContaining({
        event_type: "period_start",
        team_side: "match",
        description: "2nd Half started",
      }),
    });
  });

  it("returns the failure when the period change is rejected", async () => {
    const fixture_use_cases = {
      update_period: vi
        .fn()
        .mockResolvedValue({ success: false, error: "Refresh the page" }),
    };

    await expect(
      change_game_period({
        fixture: { id: "fixture-1", current_period: "half_time" } as never,
        new_period: "second_half",
        new_period_label: "2nd Half",
        minute: 45,
        period_sequence: ["first_half", "half_time", "second_half"],
        fixture_use_cases: fixture_use_cases as never,
      }),
    ).resolves.toEqual({ success: false, error: "Refresh the page" });
  });

  it("ends the current period in one write and returns the completed period label", async () => {
    const fixture_use_cases = {
      update_period: vi.fn().mockResolvedValue({
        success: true,
        data: { id: "fixture-1", current_period: "half_time" },
      }),
    };

    await expect(
      end_game_period({
        fixture: { id: "fixture-1", current_period: "first_half" } as never,
        minute: 45,
        transition: {
          next_period: "half_time",
          completed_period_label: "1st Half",
        },
        period_sequence: ["first_half", "half_time", "second_half"],
        fixture_use_cases: fixture_use_cases as never,
      }),
    ).resolves.toEqual({
      success: true,
      data: {
        fixture: { id: "fixture-1", current_period: "half_time" },
        completed_period_label: "1st Half",
      },
    });
    expect(fixture_use_cases.update_period).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({
        expected_current_period: "first_half",
        next_period: "half_time",
        period_event: expect.objectContaining({
          event_type: "period_end",
          description: "1st Half ended",
        }),
      }),
    );
  });
});
