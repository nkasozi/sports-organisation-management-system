import { describe, expect, it } from "vitest";

import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";

import {
  format_calendar_subscription_date,
  get_calendar_subscription_entity_options,
  get_calendar_subscription_https_url,
  resolve_calendar_subscription_entity_name,
} from "./calendarSubscriptionFeedPresentation";

const teams = [{ id: "team-1", name: "Lions" }] as unknown as Team[];
const competitions = [
  { id: "competition-1", name: "League" },
] as unknown as Competition[];

describe("calendarSubscriptionFeedPresentation", () => {
  it("resolves team and competition entity names from the loaded lists", () => {
    expect(
      resolve_calendar_subscription_entity_name({
        competitions,
        teams,
        selected_feed_type: "team",
        selected_entity_id: "team-1",
      }),
    ).toBe("Lions");
    expect(
      resolve_calendar_subscription_entity_name({
        competitions,
        teams,
        selected_feed_type: "competition",
        selected_entity_id: "competition-1",
      }),
    ).toBe("League");
  });

  it("names player feeds and returns empty names for unmatched selections", () => {
    expect(
      resolve_calendar_subscription_entity_name({
        competitions,
        teams,
        selected_feed_type: "player",
        selected_entity_id: "",
      }),
    ).toBe("Player Feed");
    expect(
      resolve_calendar_subscription_entity_name({
        competitions,
        teams,
        selected_feed_type: "team",
        selected_entity_id: "missing",
      }),
    ).toBe("");
    expect(
      resolve_calendar_subscription_entity_name({
        competitions,
        teams,
        selected_feed_type: "competition",
        selected_entity_id: "",
      }),
    ).toBe("");
  });

  it("returns no entity options for player feeds and blank urls for invalid tokens", () => {
    expect(
      get_calendar_subscription_entity_options({
        competitions,
        teams,
        selected_feed_type: "player",
      }),
    ).toEqual([]);
    expect(
      get_calendar_subscription_https_url({ base_url: "https://x", token: "" }),
    ).toBe("");
    expect(format_calendar_subscription_date("")).toBe("Never");
  });
});
