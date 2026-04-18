import { describe, expect, it, vi } from "vitest";

import { ANY_VALUE } from "$lib/core/interfaces/ports";

import { load_fixture_lineup_create_reference_data } from "./fixtureLineupCreateDataReference";
import type { FixtureLineupCreateDependencies } from "./fixtureLineupCreateDataTypes";
import type { FixtureLineupCreateAuthProfileState } from "./fixtureLineupCreatePageContracts";

describe("fixtureLineupCreateDataReference", () => {
  type MockDependencies = {
    [Key in keyof FixtureLineupCreateDependencies]?: Partial<
      FixtureLineupCreateDependencies[Key]
    >;
  };
  function create_dependencies() {
    return {
      competition_use_cases: { list: vi.fn() },
      fixture_use_cases: { list: vi.fn() },
      organization_use_cases: { list: vi.fn() },
      team_use_cases: { list: vi.fn() },
    } satisfies MockDependencies;
  }

  it("filters organizations to the authorized scope and surfaces the empty-fixture guidance", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    dependencies.team_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "team-1" }] },
    });
    dependencies.competition_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "competition-1" }] },
    });
    dependencies.organization_use_cases.list.mockResolvedValue({
      success: true,
      data: {
        items: [
          { id: "organization-1", name: "Premier League" },
          { id: "organization-2", name: "Cup" },
        ],
      },
    });

    const result = await load_fixture_lineup_create_reference_data(
      {
        status: "present",
        profile: { organization_id: "organization-1", team_id: "" },
      } as FixtureLineupCreateAuthProfileState,
      "",
      dependencies as unknown as FixtureLineupCreateDependencies,
    );

    expect(result.organizations).toEqual([
      { id: "organization-1", name: "Premier League" },
    ]);
    expect(result.selected_organization_state).toEqual({
      status: "present",
      organization: {
        id: "organization-1",
        name: "Premier League",
      },
    });
    expect(result.error_message).toContain("No fixtures available.");
  });

  it("keeps all organizations available for unrestricted users and honors the form organization selection", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "fixture-1" }] },
    });
    dependencies.team_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    dependencies.competition_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    dependencies.organization_use_cases.list.mockResolvedValue({
      success: true,
      data: {
        items: [
          { id: "organization-1", name: "Premier League" },
          { id: "organization-2", name: "Cup" },
        ],
      },
    });

    const result = await load_fixture_lineup_create_reference_data(
      {
        status: "present",
        profile: { organization_id: ANY_VALUE, team_id: "" },
      } as FixtureLineupCreateAuthProfileState,
      "organization-2",
      dependencies as unknown as FixtureLineupCreateDependencies,
    );

    expect(result.organizations).toHaveLength(2);
    expect(result.selected_organization_state).toEqual({
      status: "present",
      organization: {
        id: "organization-2",
        name: "Cup",
      },
    });
    expect(result.error_message).toBe("");
  });
});
