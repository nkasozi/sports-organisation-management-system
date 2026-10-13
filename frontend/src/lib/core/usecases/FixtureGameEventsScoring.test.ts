import { describe, expect, it, vi } from "vitest";

import { create_score_award_resolver } from "../entities/SportEventCatalog";
import { create_fixture_game_events } from "./FixtureGameEventsUseCases";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn() },
}));

const FIXTURE = {
  id: "fx1",
  home_team_score: 1,
  away_team_score: 2,
  game_events: [],
};

describe("recording a scoring event", () => {
  it("adds the points the sport awards for the event", async () => {
    const repository = {
      find_by_id: vi.fn().mockResolvedValue({ success: true, data: FIXTURE }),
      update: vi.fn((id: string, updates: object) =>
        Promise.resolve({
          success: true,
          data: { ...FIXTURE, ...updates, id },
        }),
      ),
    };
    const event = {
      event_type: "field_goal_3pt",
      team_side: "away",
      minute: 5,
    };

    const result = await create_fixture_game_events(
      repository as never,
    ).record_game_event(
      "fx1",
      event as never,
      create_score_award_resolver([
        { event_type: "field_goal_3pt", points_awarded: 3 },
      ])("field_goal_3pt"),
    );

    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledWith(
      "fx1",
      expect.objectContaining({ away_team_score: 5 }),
    );
  });
});
