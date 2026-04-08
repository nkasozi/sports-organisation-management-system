import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth_state,
  fetch_entities_for_type_mock,
  get_use_cases_for_entity_type_mock,
} = vi.hoisted(() => ({
  auth_state: { current_profile: { id: "rater-1" } },
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

import {
  fetch_fixtures_from_official,
  fetch_officials_from_fixture,
  fetch_officials_from_organization,
} from "./officialDataFetcher";

describe("officialDataFetcher", () => {
  beforeEach(() => {
    auth_state.current_profile = { id: "rater-1" };
    fetch_entities_for_type_mock.mockReset();
    get_use_cases_for_entity_type_mock.mockReset();
  });

  it("loads organization officials directly through the shared entity fetcher", async () => {
    fetch_entities_for_type_mock.mockResolvedValue([{ id: "official-1" }]);

    await expect(
      fetch_officials_from_organization("organization-1"),
    ).resolves.toEqual([{ id: "official-1" }]);
  });

  it("builds official display options from a fixture while excluding already-rated officials", async () => {
    get_use_cases_for_entity_type_mock.mockReturnValue({
      success: true,
      data: {
        get_by_id: vi.fn().mockResolvedValue({
          success: true,
          data: {
            assigned_officials: [
              { official_id: "official-1", role_name: "Referee" },
              { official_id: "official-2", role_name: "Assistant" },
            ],
          },
        }),
      },
    });
    fetch_entities_for_type_mock
      .mockResolvedValueOnce([{ official_id: "official-2" }])
      .mockResolvedValueOnce([
        { id: "official-1", first_name: "Ada", last_name: "Stone" },
        { id: "official-2", first_name: "Bo", last_name: "Reed" },
      ]);

    await expect(
      fetch_officials_from_fixture("fixture-1", "organization-1"),
    ).resolves.toEqual([
      {
        id: "official-1",
        first_name: "Ada",
        last_name: "Stone",
        name: "Ada Stone - Referee",
      },
    ]);
  });

  it("returns completed, assigned fixtures for an official that have not been rated yet", async () => {
    fetch_entities_for_type_mock
      .mockResolvedValueOnce([
        { id: "fixture-1", status: "completed" },
        { id: "fixture-2", status: "scheduled" },
      ])
      .mockResolvedValueOnce([
        {
          fixture_id: "fixture-1",
          assigned_officials: [{ official_id: "official-1" }],
        },
        {
          fixture_id: "fixture-2",
          assigned_officials: [{ official_id: "official-1" }],
        },
      ])
      .mockResolvedValueOnce([]);

    await expect(
      fetch_fixtures_from_official("official-1", "organization-1"),
    ).resolves.toEqual([{ id: "fixture-1", status: "completed" }]);
  });
});
