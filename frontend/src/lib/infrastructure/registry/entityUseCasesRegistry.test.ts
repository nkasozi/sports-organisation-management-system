import { afterEach, describe, expect, it, vi } from "vitest";

import { get_use_cases_for_entity_type } from "./entityUseCasesRegistry";
import {
  REGISTRY_ERROR_MESSAGE,
  REGISTRY_LOG_EVENT,
} from "./registryConstants";

vi.mock("./useCaseFactories", () => {
  const factory = (): Record<string, unknown> => ({});
  return Object.fromEntries(
    [
      "get_audit_log_use_cases",
      "get_competition_format_use_cases",
      "get_competition_stage_use_cases",
      "get_competition_use_cases",
      "get_fixture_details_setup_use_cases",
      "get_fixture_lineup_use_cases",
      "get_fixture_use_cases",
      "get_game_event_log_use_cases",
      "get_game_event_type_use_cases",
      "get_game_official_role_use_cases",
      "get_gender_use_cases",
      "get_identification_type_use_cases",
      "get_identification_use_cases",
      "get_jersey_color_use_cases",
      "get_live_game_log_use_cases",
      "get_official_associated_team_use_cases",
      "get_official_performance_rating_use_cases",
      "get_official_use_cases",
      "get_organization_with_defaults_use_cases",
      "get_player_position_use_cases",
      "get_player_profile_use_cases",
      "get_player_team_membership_use_cases",
      "get_player_team_transfer_history_use_cases",
      "get_player_use_cases",
      "get_profile_link_use_cases",
      "get_qualification_use_cases",
      "get_sport_use_cases",
      "get_system_user_use_cases",
      "get_team_profile_use_cases",
      "get_team_staff_role_use_cases",
      "get_team_staff_use_cases",
      "get_team_use_cases",
      "get_venue_use_cases",
    ].map((name) => [name, factory]),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("get_use_cases_for_entity_type", () => {
  it("returns a user-safe failure for an unknown entity type", () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = get_use_cases_for_entity_type("not_an_entity");

    expect(result).toEqual({
      success: false,
      error: REGISTRY_ERROR_MESSAGE.UNKNOWN_ENTITY_TYPE,
    });
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: REGISTRY_LOG_EVENT.UNKNOWN_ENTITY_TYPE,
        entity_type: "not_an_entity",
      }),
    );
  });

  it("returns a user-safe failure for an empty entity type", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = get_use_cases_for_entity_type("");

    expect(result).toEqual({
      success: false,
      error: REGISTRY_ERROR_MESSAGE.INVALID_ENTITY_TYPE,
    });
  });

  it("resolves known entity types case-insensitively", () => {
    const result = get_use_cases_for_entity_type("Venue");

    expect(result.success).toBe(true);
  });
});
