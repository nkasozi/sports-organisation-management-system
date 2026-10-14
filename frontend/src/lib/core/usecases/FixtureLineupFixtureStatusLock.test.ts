import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FixtureLineupRepository } from "../interfaces/ports";
import { create_fixture_lineup_use_cases } from "./FixtureLineupUseCases";
import {
  create_fixture_repository_with_status,
  create_mock_repository,
  create_test_lineup,
} from "./FixtureLineupUseCases.test_support";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn() },
}));

const PLAYER = {
  id: "player-123",
  first_name: "Test",
  last_name: "Player",
  jersey_number: 10,
  position: "Forward",
  is_captain: false,
  is_substitute: false,
};

describe("lineup edits follow the fixture lifecycle", () => {
  let repository: FixtureLineupRepository;

  beforeEach(() => {
    repository = create_mock_repository();
    vi.mocked(repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_lineup({ status: "submitted" }),
    });
    vi.mocked(repository.update).mockImplementation(async (_id, updates) => ({
      success: true,
      data: create_test_lineup(updates as never),
    }));
  });

  function use_cases_for(
    fixture_status: string,
  ): ReturnType<typeof create_fixture_lineup_use_cases> {
    return create_fixture_lineup_use_cases(
      repository,
      create_fixture_repository_with_status(fixture_status),
    );
  }

  it("allows editing a submitted lineup before kick-off", async () => {
    const result = await use_cases_for("scheduled").update("lineup-123", {
      notes: "late change",
    });
    expect(result.success).toBe(true);
  });

  it.each(["in_progress", "completed", "postponed", "cancelled"])(
    "refuses to edit a lineup once the fixture is %s",
    async (fixture_status) => {
      const result = await use_cases_for(fixture_status).update("lineup-123", {
        notes: "late change",
      });
      expect(result.success).toBe(false);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );

  it("refuses to delete a lineup after kick-off", async () => {
    const result = await use_cases_for("in_progress").delete("lineup-123");
    expect(result.success).toBe(false);
    expect(repository.delete_by_id).not.toHaveBeenCalled();
  });

  it("records player times on a locked lineup during the game", async () => {
    vi.mocked(repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_lineup({ status: "locked" }),
    });
    const result = await use_cases_for("in_progress").record_live_player_times({
      lineup_id: "lineup-123",
      selected_players: [{ ...PLAYER, time_on: "15", time_off: "" }] as never,
    });
    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledWith("lineup-123", {
      selected_players: [{ ...PLAYER, time_on: "15", time_off: "" }],
    });
  });

  it("refuses to add or drop players through the live player times path", async () => {
    const result = await use_cases_for("in_progress").record_live_player_times({
      lineup_id: "lineup-123",
      selected_players: [{ ...PLAYER, id: "someone-else" }] as never,
    });
    expect(result.success).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("refuses to change player details other than times during the game", async () => {
    const result = await use_cases_for("in_progress").record_live_player_times({
      lineup_id: "lineup-123",
      selected_players: [{ ...PLAYER, jersey_number: 99 }] as never,
    });
    expect(result.success).toBe(false);
  });

  it("refuses live player times once the game is completed", async () => {
    const result = await use_cases_for("completed").record_live_player_times({
      lineup_id: "lineup-123",
      selected_players: [PLAYER] as never,
    });
    expect(result.success).toBe(false);
  });
});
