import { describe, expect, it } from "vitest";
import {
  create_empty_player_team_membership_input,
  validate_player_team_membership_input,
} from "./PlayerTeamMembership";

describe("PlayerTeamMembership", () => {
  it("requires player_id and team_id", () => {
    const errors = validate_player_team_membership_input({
      player_id: "",
      team_id: "",
      start_date: "2025-01-01",
      end_date: null,
      jersey_number: null,
      status: "active",
    });

    expect(errors).toContain("Player is required");
    expect(errors).toContain("Team is required");
  });

  it("validates jersey_number range when provided", () => {
    const too_low_errors = validate_player_team_membership_input({
      player_id: "player_1",
      team_id: "team_1",
      start_date: "2025-01-01",
      end_date: null,
      jersey_number: 0,
      status: "active",
    });

    const too_high_errors = validate_player_team_membership_input({
      player_id: "player_1",
      team_id: "team_1",
      start_date: "2025-01-01",
      end_date: null,
      jersey_number: 100,
      status: "active",
    });

    expect(too_low_errors).toContain("Jersey number must be between 1 and 99");
    expect(too_high_errors).toContain("Jersey number must be between 1 and 99");
  });

  it("creates a reasonable empty input", () => {
    const input = create_empty_player_team_membership_input();

    expect(input.player_id).toBe("");
    expect(input.team_id).toBe("");
    expect(input.status).toBe("active");
    expect(typeof input.start_date).toBe("string");
  });
});
