import { describe, expect, it, vi } from "vitest";

import { load_competition_create_organizations } from "./competitionCreatePageData";

vi.mock("$lib/adapters/persistence/sportService", () => ({
  get_sport_by_id: vi.fn(),
}));

function create_dependencies(): {
  organization_use_cases: {
    get_by_id: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };
} {
  return {
    organization_use_cases: { get_by_id: vi.fn(), list: vi.fn() },
  };
}

describe("load_competition_create_organizations", () => {
  it("returns empty results when the restricted organization cannot be loaded", async () => {
    const dependencies = create_dependencies();
    dependencies.organization_use_cases.get_by_id.mockResolvedValue({
      success: false,
      error: "nope",
    });
    await expect(
      load_competition_create_organizations({
        current_auth_profile_state: {
          status: "present",
          profile: { organization_id: "organization-1" } as never,
        },
        dependencies: dependencies as never,
        is_organization_restricted: true,
      }),
    ).resolves.toEqual({
      organizations: [],
      organization_options: [],
      preselected_organization_id: "",
    });
  });

  it("lists all organizations when unrestricted or the profile lacks an organization", async () => {
    const dependencies = create_dependencies();
    dependencies.organization_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "o-1", name: "One" }] },
    });
    const result = await load_competition_create_organizations({
      current_auth_profile_state: {
        status: "present",
        profile: { organization_id: "" } as never,
      },
      dependencies: dependencies as never,
      is_organization_restricted: true,
    });
    expect(dependencies.organization_use_cases.list).toHaveBeenCalledWith(
      {},
      { page_number: 1, page_size: 100 },
    );
    expect(
      dependencies.organization_use_cases.get_by_id,
    ).not.toHaveBeenCalled();
    expect(result).toEqual({
      organizations: [{ id: "o-1", name: "One" }],
      organization_options: [{ value: "o-1", label: "One" }],
      preselected_organization_id: "",
    });
  });

  it("returns no organizations when listing fails", async () => {
    const dependencies = create_dependencies();
    dependencies.organization_use_cases.list.mockResolvedValue({
      success: false,
    });
    await expect(
      load_competition_create_organizations({
        current_auth_profile_state: { status: "missing" },
        dependencies: dependencies as never,
        is_organization_restricted: false,
      }),
    ).resolves.toEqual({
      organizations: [],
      organization_options: [],
      preselected_organization_id: "",
    });
  });
});
