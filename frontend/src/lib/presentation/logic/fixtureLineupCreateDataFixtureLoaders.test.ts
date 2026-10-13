import { describe, expect, it, vi } from "vitest";

import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";

import {
  load_fixture_competition,
  load_scheduled_fixture,
  resolve_fixture_player_limits,
} from "./fixtureLineupCreateDataFixtureLoaders";
import type { FixtureLineupCreateDependencies } from "./fixtureLineupCreateDataTypes";

const { get_sport_by_id_mock } = vi.hoisted(() => ({
  get_sport_by_id_mock: vi.fn(),
}));

vi.mock("$lib/adapters/persistence/sportService", () => ({
  get_sport_by_id: get_sport_by_id_mock,
}));

function create_dependencies(
  fixture_result: unknown,
  competition_result: unknown,
): FixtureLineupCreateDependencies {
  return {
    fixture_use_cases: { get_by_id: vi.fn().mockResolvedValue(fixture_result) },
    competition_use_cases: {
      get_by_id: vi.fn().mockResolvedValue(competition_result),
    },
  } as unknown as FixtureLineupCreateDependencies;
}

describe("fixtureLineupCreateDataFixtureLoaders", () => {
  it("rejects fixtures that are not scheduled and clears the selection", async () => {
    const dependencies = create_dependencies(
      { success: true, data: { id: "fixture-1", status: "in_progress" } },
      { success: false },
    );
    const result = await load_scheduled_fixture("fixture-1", dependencies);
    expect(result).toEqual({
      success: false,
      error_message: expect.stringContaining('"in progress"'),
      should_clear_fixture: true,
      failure_reason: "fixture_unavailable",
    });
  });

  it("returns the scheduled fixture", async () => {
    const fixture = { id: "fixture-1", status: "scheduled" };
    const dependencies = create_dependencies(
      { success: true, data: fixture },
      { success: false },
    );
    await expect(
      load_scheduled_fixture("fixture-1", dependencies),
    ).resolves.toEqual({ success: true, data: fixture });
  });

  it("fails without clearing the fixture when the competition is missing", async () => {
    const dependencies = create_dependencies(
      { success: false },
      { success: false },
    );
    const result = await load_fixture_competition(
      { competition_id: "competition-1" } as unknown as Fixture,
      dependencies,
    );
    expect(result).toEqual({
      success: false,
      error_message: expect.stringContaining(
        "Failed to load competition for fixture.",
      ),
      should_clear_fixture: false,
      failure_reason: "competition_unavailable",
    });
  });

  it("uses default limits with overrides when the organization has no sport", async () => {
    get_sport_by_id_mock.mockClear();
    const limits = await resolve_fixture_player_limits(
      { success: true, data: { sport_id: "" } } as never,
      { rule_overrides: { min_players_on_field: 4 } } as unknown as Competition,
    );
    expect(get_sport_by_id_mock).not.toHaveBeenCalled();
    expect(limits).toEqual({
      min_players: 4,
      max_players: 18,
      starters_count: 11,
    });
  });

  it("falls back to default limits when the sport lookup fails", async () => {
    get_sport_by_id_mock.mockResolvedValue({ success: false });
    const limits = await resolve_fixture_player_limits(
      { success: true, data: { sport_id: "sport-1" } } as never,
      { rule_overrides: {} } as unknown as Competition,
    );
    expect(get_sport_by_id_mock).toHaveBeenCalledWith("sport-1");
    expect(limits).toEqual({
      min_players: 2,
      max_players: 18,
      starters_count: 11,
    });
  });
});
