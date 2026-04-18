import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Organization } from "$lib/core/entities/Organization";

import {
  initialize_competition_create_page,
  load_competition_create_organization_state,
} from "./competitionCreatePageFlow";

const {
  check_entity_authorized_mock,
  ensure_auth_profile_mock,
  load_competition_create_formats_mock,
  load_competition_create_organizations_mock,
  load_competition_create_sport_mock,
  load_competition_create_team_options_mock,
} = vi.hoisted(() => ({
  check_entity_authorized_mock: vi.fn(),
  ensure_auth_profile_mock: vi.fn(),
  load_competition_create_formats_mock: vi.fn(),
  load_competition_create_organizations_mock: vi.fn(),
  load_competition_create_sport_mock: vi.fn(),
  load_competition_create_team_options_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({
    check_entity_authorized: check_entity_authorized_mock,
  }),
}));

vi.mock("$lib/presentation/logic/authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

vi.mock("./competitionCreatePageData", () => ({
  load_competition_create_formats: load_competition_create_formats_mock,
  load_competition_create_organizations:
    load_competition_create_organizations_mock,
  load_competition_create_sport: load_competition_create_sport_mock,
  load_competition_create_team_options:
    load_competition_create_team_options_mock,
}));

describe("competitionCreatePageFlow", () => {
  function create_organization(
    overrides: Partial<Organization> = {},
  ): Organization {
    return {
      id: "organization-1",
      name: "Premier League",
      description: "Top division",
      sport_id: "sport-1",
      founded_date: "",
      contact_email: "admin@example.com",
      contact_phone: "123456789",
      address: "Kampala",
      website: "https://example.com",
      status: "active",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      ...overrides,
    } as Organization;
  }

  beforeEach(() => {
    check_entity_authorized_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    load_competition_create_formats_mock.mockReset();
    load_competition_create_organizations_mock.mockReset();
    load_competition_create_sport_mock.mockReset();
    load_competition_create_team_options_mock.mockReset();
  });

  it("returns the auth error without loading any organizations", async () => {
    ensure_auth_profile_mock.mockResolvedValue({
      success: false,
      error_message: "Missing profile",
    });

    await expect(
      initialize_competition_create_page({
        current_auth_profile_state: { status: "missing" },
        dependencies: {} as never,
        is_organization_restricted: false,
        raw_token_state: { status: "missing" },
      }),
    ).resolves.toEqual({
      access_denied: false,
      error_message: "Missing profile",
      organization_options: [],
      organizations: [],
      preselected_organization_id: "",
    });
  });

  it("reports access denied when the token is not authorized to create competitions", async () => {
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    check_entity_authorized_mock.mockResolvedValue({
      success: true,
      data: { is_authorized: false },
    });

    await expect(
      initialize_competition_create_page({
        current_auth_profile_state: { status: "missing" },
        dependencies: {} as never,
        is_organization_restricted: false,
        raw_token_state: { status: "present", value: "token-1" },
      }),
    ).resolves.toEqual({
      access_denied: true,
      error_message: "",
      organization_options: [],
      organizations: [],
      preselected_organization_id: "",
    });
  });

  it("loads the organization selection state after auth succeeds", async () => {
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    load_competition_create_organizations_mock.mockResolvedValue({
      organization_options: [
        { value: "organization-1", label: "Premier League" },
      ],
      organizations: [{ id: "organization-1", name: "Premier League" }],
      preselected_organization_id: "organization-1",
    });

    await expect(
      initialize_competition_create_page({
        current_auth_profile_state: {
          status: "present",
          profile: { organization_id: "organization-1" } as never,
        },
        dependencies: {} as never,
        is_organization_restricted: true,
        raw_token_state: { status: "missing" },
      }),
    ).resolves.toEqual({
      access_denied: false,
      error_message: "",
      organization_options: [
        { value: "organization-1", label: "Premier League" },
      ],
      organizations: [{ id: "organization-1", name: "Premier League" }],
      preselected_organization_id: "organization-1",
    });
  });

  it("loads team, format, and sport state for the selected organization in parallel", async () => {
    load_competition_create_team_options_mock.mockResolvedValue([
      { value: "team-1", label: "Lions" },
    ]);
    load_competition_create_formats_mock.mockResolvedValue({
      competition_formats: [{ id: "format-1", name: "Round Robin" }],
      competition_format_options: [{ value: "format-1", label: "Round Robin" }],
    });
    load_competition_create_sport_mock.mockResolvedValue({
      success: true,
      data: {
        id: "sport-1",
        name: "Football",
      },
    });

    await expect(
      load_competition_create_organization_state({
        dependencies: {} as never,
        organization_id: "organization-1",
        organizations: [create_organization()],
      }),
    ).resolves.toEqual({
      team_options: [{ value: "team-1", label: "Lions" }],
      competition_formats: [{ id: "format-1", name: "Round Robin" }],
      competition_format_options: [{ value: "format-1", label: "Round Robin" }],
      selected_sport_state: {
        status: "present",
        sport: { id: "sport-1", name: "Football" },
      },
    });
  });
});
