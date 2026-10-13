import { describe, expect, it } from "vitest";

import {
  determine_initial_wizard_step,
  determine_step_after_team_auto_selected,
} from "./fixtureLineupWizard";

describe("fixtureLineupWizard", () => {
  describe("determine_initial_wizard_step", () => {
    it("returns step 1 when organization is restricted and pre-populated", () => {
      const result = determine_initial_wizard_step({
        organization_is_restricted: true,
        organization_id: "org-123",
        has_selected_organization: true,
      });
      expect(result).toBe(1);
    });

    it("returns step 0 when organization is not restricted", () => {
      const result = determine_initial_wizard_step({
        organization_is_restricted: false,
        organization_id: "org-123",
        has_selected_organization: true,
      });
      expect(result).toBe(0);
    });

    it("returns step 0 when organization_id is empty", () => {
      const result = determine_initial_wizard_step({
        organization_is_restricted: true,
        organization_id: "",
        has_selected_organization: false,
      });
      expect(result).toBe(0);
    });

    it("returns step 0 when organization is restricted but not yet resolved", () => {
      const result = determine_initial_wizard_step({
        organization_is_restricted: true,
        organization_id: "org-123",
        has_selected_organization: false,
      });
      expect(result).toBe(0);
    });
  });

  describe("determine_step_after_team_auto_selected", () => {
    it("returns step 3 (players) when team selected and players loaded", () => {
      const result = determine_step_after_team_auto_selected({
        has_selected_team: true,
        team_players_count: 5,
      });
      expect(result).toBe(3);
    });

    it("returns step 2 (team) when team selected but no players found", () => {
      const result = determine_step_after_team_auto_selected({
        has_selected_team: true,
        team_players_count: 0,
      });
      expect(result).toBe(2);
    });

    it("returns step 2 (team) when team not selected", () => {
      const result = determine_step_after_team_auto_selected({
        has_selected_team: false,
        team_players_count: 0,
      });
      expect(result).toBe(2);
    });

    it("returns step 2 (team) when team not selected even with players", () => {
      const result = determine_step_after_team_auto_selected({
        has_selected_team: false,
        team_players_count: 10,
      });
      expect(result).toBe(2);
    });
  });
});
