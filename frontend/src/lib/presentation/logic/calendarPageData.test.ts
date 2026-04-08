import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Organization } from "$lib/core/entities/Organization";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import type { UseCasesContainer } from "$lib/infrastructure/container";

const { get_current_year_date_range_mock } = vi.hoisted(() => ({
  get_current_year_date_range_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/calendarPageState", () => ({
  get_current_year_date_range: get_current_year_date_range_mock,
}));

import { ANY_VALUE } from "$lib/core/interfaces/ports";

import {
  load_calendar_organization_bundle,
  load_calendar_organizations,
  sync_and_load_calendar_events,
} from "./calendarPageData";

function create_organization(
  overrides: Partial<Organization> = {},
): Organization {
  return {
    id: "organization-1",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    name: "Premier League",
    description: "League",
    sport_id: "sport-1",
    founded_date: null,
    contact_email: "info@example.test",
    contact_phone: "",
    address: "Main Road",
    website: "",
    status: "active",
    ...overrides,
  };
}

function create_auth_profile(organization_id: string): UserScopeProfile {
  return { organization_id, team_id: "" };
}

describe("calendarPageData", () => {
  beforeEach(() => {
    get_current_year_date_range_mock.mockReset();
  });

  it("loads organizations within the caller scope and returns an empty list on failure", async () => {
    const organizations = [
      create_organization({ id: "organization-1" }),
      create_organization({ id: "organization-2", name: "Regional League" }),
    ];
    const organization_use_cases: UseCasesContainer["organization_use_cases"] =
      {
        create: vi.fn(),
        delete: vi.fn(),
        delete_organizations: vi.fn(),
        get_by_id: vi.fn(),
        list: vi
          .fn()
          .mockResolvedValueOnce({ success: false })
          .mockResolvedValueOnce({
            success: true,
            data: { items: organizations },
          })
          .mockResolvedValueOnce({
            success: true,
            data: { items: organizations },
          }),
        update: vi.fn(),
      };

    await expect(
      load_calendar_organizations({
        current_profile: null,
        organization_use_cases,
      }),
    ).resolves.toEqual([]);
    await expect(
      load_calendar_organizations({
        current_profile: create_auth_profile("organization-1"),
        organization_use_cases,
      }),
    ).resolves.toEqual([organizations[0]]);
    await expect(
      load_calendar_organizations({
        current_profile: create_auth_profile(ANY_VALUE),
        organization_use_cases,
      }),
    ).resolves.toEqual(organizations);
  });

  it("synchronizes calendar activities before loading filtered events", async () => {
    get_current_year_date_range_mock.mockReturnValueOnce({
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    const activity_use_cases = {
      get_calendar_events: vi
        .fn()
        .mockResolvedValueOnce({ success: true, data: [{ id: "event-1" }] }),
      sync_competitions_to_activities: vi.fn().mockResolvedValue(undefined),
      sync_fixtures_to_activities: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      sync_and_load_calendar_events({
        organization_id: "organization-1",
        filter_category_id: "category-1",
        filter_competition_id: "competition-1",
        filter_team_id: "team-1",
        activity_use_cases: activity_use_cases as never,
      }),
    ).resolves.toEqual([{ id: "event-1" }]);
    expect(activity_use_cases.get_calendar_events).toHaveBeenCalledWith(
      "organization-1",
      { start_date: "2024-01-01", end_date: "2024-12-31" },
      {
        category_id: "category-1",
        competition_id: "competition-1",
        team_id: "team-1",
      },
    );
  });

  it("loads the organization bundle and tolerates partial data failures", async () => {
    get_current_year_date_range_mock.mockReturnValueOnce({
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    const use_cases = {
      activity_category_use_cases: {
        ensure_default_categories_exist: vi.fn().mockResolvedValue(undefined),
        list_by_organization: vi.fn().mockResolvedValueOnce({
          success: true,
          data: { items: [{ id: "category-1" }] },
        }),
      },
      activity_use_cases: {
        get_calendar_events: vi.fn().mockResolvedValueOnce({ success: false }),
        sync_competitions_to_activities: vi.fn().mockResolvedValue(undefined),
        sync_fixtures_to_activities: vi.fn().mockResolvedValue(undefined),
      },
      competition_use_cases: {
        list: vi.fn().mockResolvedValueOnce({
          success: true,
          data: { items: [{ id: "competition-1" }] },
        }),
      },
      team_use_cases: {
        list: vi.fn().mockResolvedValueOnce({ success: false }),
      },
    };

    await expect(
      load_calendar_organization_bundle({
        organization_id: "organization-1",
        filter_category_id: "",
        filter_competition_id: "",
        filter_team_id: "",
        use_cases: use_cases as never,
      }),
    ).resolves.toEqual({
      teams: [],
      competitions: [{ id: "competition-1" }],
      categories: [{ id: "category-1" }],
      calendar_events: [],
    });
  });
});
