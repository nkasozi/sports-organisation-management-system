import { describe, expect, it, vi } from "vitest";

import {
  build_fixture_lineup_create_auth_profile_state,
  build_fixture_lineup_create_page_view_handlers,
  build_fixture_lineup_create_page_view_props,
  has_authorization_defaults_changed,
} from "./fixtureLineupCreatePageControllerView";

const derived_state = {
  wizard_steps: [],
  organization_select_options: [{ value: "org-1", label: "Org" }],
  organization_is_restricted: true,
  fixture_select_options: [],
  fixtures_for_organization: [{}, {}],
  all_fixtures_for_org: [{}, {}, {}],
  non_scheduled_fixtures_count: 1,
  team_is_restricted: false,
  current_fixture_title: "Home vs Away",
  team_select_options: [],
  filtered_team_players: [],
} as never;

describe("fixtureLineupCreatePageControllerView", () => {
  it("maps the auth profile into the page auth state", () => {
    const profile = { id: "profile-1" };
    expect(
      build_fixture_lineup_create_auth_profile_state({
        status: "present",
        profile,
      } as never),
    ).toEqual({ status: "present", profile });
    expect(
      build_fixture_lineup_create_auth_profile_state({
        status: "missing",
      } as never),
    ).toEqual({ status: "missing" });
  });

  it("detects authorization default changes on organization or team only", () => {
    const form_data = {
      organization_id: "a",
      team_id: "b",
      notes: "",
    } as never;
    expect(has_authorization_defaults_changed(form_data, form_data)).toBe(
      false,
    );
    expect(
      has_authorization_defaults_changed(form_data, {
        organization_id: "a",
        team_id: "c",
      } as never),
    ).toBe(true);
  });

  it("builds view props from page state", () => {
    const props = build_fixture_lineup_create_page_view_props({
      derived_state,
      form_data: {
        organization_id: "org-1",
        fixture_id: "fixture-1",
        team_id: "",
        selected_players: [],
      } as never,
      organizations: [{}, {}] as never,
      selected_organization_state: { status: "missing" },
      selected_team_state: {
        status: "present",
        team: { name: "Home" },
      } as never,
      fixtures_with_complete_lineups: new Set(["x"]),
      teams_with_existing_lineups: new Map([["team-2", "Away"]]),
      available_teams: [{}] as never,
    });
    expect(props).toMatchObject({
      organization_is_restricted: true,
      fixtures_for_organization_count: 2,
      all_fixtures_for_org_count: 3,
      selected_organization_id: "org-1",
      selected_fixture_id: "fixture-1",
      organizations_count: 2,
      has_selected_organization: false,
      fixtures_with_complete_lineups_count: 1,
      existing_lineup_team_names: ["Away"],
      available_teams_count: 1,
      selected_team_name: "Home",
      notes: "",
    });
  });

  it("wires view handlers to the runtime and current starters count", () => {
    const runtime = {
      handle_fixture_change: vi.fn(async () => {}),
      handle_team_change: vi.fn(async () => {}),
    };
    const goto = vi.fn(async () => {});
    let starters_count = 1;
    const handlers = build_fixture_lineup_create_page_view_handlers({
      runtime: runtime as never,
      goto,
      get_starters_count: () => starters_count,
    });
    handlers.on_cancel();
    handlers.on_fixture_change("fixture-1");
    handlers.on_team_change("team-1");
    expect(goto).toHaveBeenCalledWith("/fixture-lineups");
    expect(runtime.handle_fixture_change).toHaveBeenCalledWith("fixture-1");
    expect(runtime.handle_team_change).toHaveBeenCalledWith("team-1");
    expect(handlers.get_player_role_label(0)).toBe("Starter");
    expect(handlers.get_player_role_label(1)).toBe("Substitute");
    starters_count = 2;
    expect(handlers.get_player_role_label(1)).toBe("Starter");
  });
});
