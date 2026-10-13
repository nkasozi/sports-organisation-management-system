import { describe, expect, it } from "vitest";

import {
  has_meaningful_changes,
  strip_convex_fields,
} from "./syncHelpers.test_support";

describe("Conflict detection scenarios", () => {
  it("scenario: same data different metadata - no conflict", () => {
    const local_record = {
      id: "team_1",
      local_id: "team_1",
      name: "Arsenal FC",
      city: "London",
      version: 5,
      updated_at: "2024-01-01T10:00:00Z",
    };
    const server_record = {
      _id: "convex_abc123",
      _creationTime: 1704067200000,
      id: "team_1",
      local_id: "team_1",
      name: "Arsenal FC",
      city: "London",
      version: 10,
      synced_at: "2024-01-01T12:00:00Z",
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(false);
  });

  it("scenario: different business data - conflict", () => {
    const local_record = {
      id: "team_1",
      name: "Arsenal FC",
      city: "North London",
    };
    const server_record = {
      _id: "convex_abc123",
      id: "team_1",
      name: "Arsenal FC",
      city: "London",
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(true);
  });

  it("scenario: local added new field - conflict", () => {
    const local_record = {
      id: "player_1",
      first_name: "John",
      last_name: "Doe",
      nickname: "Johnny",
    };
    const server_record = {
      _id: "convex_xyz",
      id: "player_1",
      first_name: "John",
      last_name: "Doe",
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(true);
  });

  it("scenario: complex nested structure identical - no conflict", () => {
    const local_record = {
      id: "comp_1",
      name: "Premier League",
      rules: {
        points_for_win: 3,
        points_for_draw: 1,
        tiebreakers: ["goal_difference", "goals_scored"],
      },
    };
    const server_record = {
      _id: "convex_comp",
      id: "comp_1",
      name: "Premier League",
      rules: {
        points_for_win: 3,
        points_for_draw: 1,
        tiebreakers: ["goal_difference", "goals_scored"],
      },
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(false);
  });

  it("scenario: nested array order different - conflict", () => {
    const local_record = {
      id: "comp_1",
      tiebreakers: ["goals_scored", "goal_difference"],
    };
    const server_record = {
      _id: "convex_comp",
      id: "comp_1",
      tiebreakers: ["goal_difference", "goals_scored"],
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(true);
  });
});
