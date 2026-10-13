import { describe, expect, it, vi } from "vitest";

import {
  build_dynamic_entity_form_auth_profile_state,
  build_dynamic_entity_form_external_dependencies,
  create_initial_dynamic_entity_form_state,
  create_initial_dynamic_entity_form_ui_state,
  create_initial_dynamic_entity_form_warning_state,
} from "./dynamicEntityFormComponentSetup";

const { factories, get_use_cases_mock } = vi.hoisted(() => ({
  factories: {
    fixture: { kind: "fixture" },
    team: { kind: "team" },
    official: { kind: "official" },
    official_associated_team: { kind: "official_associated_team" },
    membership: { kind: "membership" },
  },
  get_use_cases_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_fixture_use_cases: () => factories.fixture,
  get_team_use_cases: () => factories.team,
  get_official_use_cases: () => factories.official,
  get_official_associated_team_use_cases: () =>
    factories.official_associated_team,
  get_player_team_membership_use_cases: () => factories.membership,
}));

vi.mock("../../infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_mock,
}));

describe("dynamicEntityFormComponentSetup", () => {
  it("creates empty initial form, ui, and warning states", () => {
    expect(create_initial_dynamic_entity_form_state()).toEqual({
      form_data: {},
      validation_errors: {},
      foreign_key_options: {},
      filtered_fields_loading: {},
      all_competition_teams_cache: [],
    });
    expect(create_initial_dynamic_entity_form_ui_state()).toEqual({
      is_loading: false,
      is_save_in_progress: false,
      auth_profile_missing: false,
      auth_error_message: "",
      permission_denied: false,
      permission_denied_message: "",
      save_error_message: "",
    });
    expect(create_initial_dynamic_entity_form_warning_state()).toEqual({
      color_clash_warnings: [],
      official_team_conflict_warnings: [],
      gender_mismatch_warnings: [],
      fixture_team_gender_mismatch_warnings: [],
    });
  });

  it("maps the auth profile into a scope profile state", () => {
    const profile = { id: "profile-1", role: "org_admin" };
    expect(
      build_dynamic_entity_form_auth_profile_state({
        status: "present",
        profile,
      } as never),
    ).toEqual({ status: "present", profile });
    expect(
      build_dynamic_entity_form_auth_profile_state({
        status: "missing",
      } as never),
    ).toEqual({ status: "missing" });
  });

  it("wires conflict and gender dependencies from the registries", () => {
    get_use_cases_mock.mockImplementation((entity_type: string) => ({
      success: false,
      error: entity_type,
    }));
    expect(build_dynamic_entity_form_external_dependencies()).toEqual({
      player_team_membership_use_cases: factories.membership,
      conflict_dependencies: {
        fixture_use_cases: factories.fixture,
        team_use_cases: factories.team,
        official_use_cases: factories.official,
        official_associated_team_use_cases: factories.official_associated_team,
      },
      gender_dependencies: {
        team_use_cases: factories.team,
        player_use_cases_result: { success: false, error: "player" },
        gender_use_cases_result: { success: false, error: "gender" },
      },
    });
  });
});
