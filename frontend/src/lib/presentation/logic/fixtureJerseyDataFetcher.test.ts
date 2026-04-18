import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthProfileState } from "$lib/presentation/stores/authTypes";

import {
  fetch_filtered_jersey_options,
  fetch_fixtures_for_rating,
  fetch_fixtures_without_setup,
} from "./fixtureJerseyDataFetcher";

const {
  auth_state,
  fetch_entities_for_type_mock,
  get_use_cases_for_entity_type_mock,
} = vi.hoisted(() => ({
  auth_state: {
    current_profile: {
      status: "present",
      profile: {
        id: "profile-1",
        display_name: "Team Manager",
        email: "manager@example.com",
        role: "team_manager",
        organization_id: "organization-1",
        organization_name: "Organization 1",
        team_id: "team-home",
      },
    } as AuthProfileState,
  },
  fetch_entities_for_type_mock: vi.fn(),
  get_use_cases_for_entity_type_mock: vi.fn(),
}));

vi.mock("svelte/store", async () => {
  const actual =
    await vi.importActual<typeof import("svelte/store")>("svelte/store");
  return { ...actual, get: vi.fn(() => auth_state) };
});

vi.mock("../../infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

vi.mock("./dynamicFormDataLoader", () => ({
  fetch_entities_for_type: fetch_entities_for_type_mock,
}));

describe("fixtureJerseyDataFetcher", () => {
  beforeEach(() => {
    auth_state.current_profile = {
      status: "present",
      profile: {
        id: "profile-1",
        display_name: "Team Manager",
        email: "manager@example.com",
        role: "team_manager",
        organization_id: "organization-1",
        organization_name: "Organization 1",
        team_id: "team-home",
      },
    };
    fetch_entities_for_type_mock.mockReset();
    get_use_cases_for_entity_type_mock.mockReset();
  });

  it("filters out fixtures that already have setup records", async () => {
    fetch_entities_for_type_mock
      .mockResolvedValueOnce([{ id: "fixture-1" }, { id: "fixture-2" }])
      .mockResolvedValueOnce([{ fixture_id: "fixture-2" }]);

    await expect(
      fetch_fixtures_without_setup("organization-1"),
    ).resolves.toEqual([{ id: "fixture-1" }]);
  });

  it("returns only completed fixtures for the current team when loading rating options", async () => {
    fetch_entities_for_type_mock.mockResolvedValue([
      { id: "fixture-1", status: "completed", home_team_id: "team-home" },
      { id: "fixture-2", status: "scheduled", home_team_id: "team-home" },
      { id: "fixture-3", status: "completed", away_team_id: "team-away" },
    ]);

    await expect(fetch_fixtures_for_rating("organization-1")).resolves.toEqual([
      { id: "fixture-1", status: "completed", home_team_id: "team-home" },
    ]);
  });

  it("returns empty jersey options when the field has no filter config or required use cases are missing", async () => {
    get_use_cases_for_entity_type_mock.mockReturnValue({ success: false });

    await expect(
      fetch_filtered_jersey_options({} as never, "fixture-1"),
    ).resolves.toEqual({
      jerseys: [],
    });
    await expect(
      fetch_filtered_jersey_options(
        {
          foreign_key_filter: {
            filter_type: "team_jersey_from_fixture",
            team_side: "home",
          },
        } as never,
        "fixture-1",
      ),
    ).resolves.toEqual({ jerseys: [] });
  });

  it("treats a missing auth profile as all-teams scope for rating fixtures", async () => {
    auth_state.current_profile = { status: "missing" };
    fetch_entities_for_type_mock.mockResolvedValue([
      { id: "fixture-1", status: "completed", home_team_id: "team-home" },
      { id: "fixture-2", status: "completed", away_team_id: "team-away" },
    ]);

    await expect(fetch_fixtures_for_rating("organization-1")).resolves.toEqual([
      { id: "fixture-1", status: "completed", home_team_id: "team-home" },
      { id: "fixture-2", status: "completed", away_team_id: "team-away" },
    ]);
  });

  it("loads filtered jersey options from the resolved fixture holder", async () => {
    const fixture_use_cases = {
      get_by_id: vi.fn().mockResolvedValue({
        success: true,
        data: { home_team_id: "team-home" },
      }),
    };
    const jersey_use_cases = {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ id: "jersey-1", name: "Home Kit" }] },
      }),
    };
    get_use_cases_for_entity_type_mock
      .mockReturnValueOnce({ success: true, data: fixture_use_cases })
      .mockReturnValueOnce({ success: true, data: jersey_use_cases });

    await expect(
      fetch_filtered_jersey_options(
        {
          field_name: "home_jersey_id",
          foreign_key_filter: {
            filter_type: "team_jersey_from_fixture",
            team_side: "home",
          },
        } as never,
        "fixture-1",
      ),
    ).resolves.toEqual({ jerseys: [{ id: "jersey-1", name: "Home Kit" }] });
    expect(jersey_use_cases.list).toHaveBeenCalledWith({
      holder_type: "team",
      holder_id: "team-home",
    });
  });
});
