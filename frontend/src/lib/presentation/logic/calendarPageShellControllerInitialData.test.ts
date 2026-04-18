import { beforeEach, describe, expect, it, vi } from "vitest";

import { load_calendar_shell_initial_data } from "./calendarPageShellControllerInitialData";

const {
  ensure_auth_profile_mock,
  fetch_public_data_from_convex_mock,
  load_calendar_organization_bundle_mock,
  load_calendar_organizations_mock,
} = vi.hoisted(() => ({
  ensure_auth_profile_mock: vi.fn(),
  fetch_public_data_from_convex_mock: vi.fn(),
  load_calendar_organization_bundle_mock: vi.fn(),
  load_calendar_organizations_mock: vi.fn(),
}));

vi.mock("./authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

vi.mock("$lib/infrastructure/sync/convexPublicDataService", () => ({
  fetch_public_data_from_convex: fetch_public_data_from_convex_mock,
}));

vi.mock("./calendarPageData", () => ({
  load_calendar_organization_bundle: load_calendar_organization_bundle_mock,
  load_calendar_organizations: load_calendar_organizations_mock,
}));

describe("calendarPageShellControllerInitialData", () => {
  beforeEach(() => {
    ensure_auth_profile_mock.mockReset();
    fetch_public_data_from_convex_mock.mockReset();
    load_calendar_organization_bundle_mock.mockReset();
    load_calendar_organizations_mock.mockReset();
  });

  it("returns the auth error for protected views when the user is not authenticated", async () => {
    ensure_auth_profile_mock.mockResolvedValueOnce({
      success: false,
      error_message: "Access denied",
    });

    await expect(
      load_calendar_shell_initial_data({
        is_public: false,
        current_profile_state: { status: "missing" },
        preferred_organization_id: "organization-1",
        use_cases: {} as never,
      }),
    ).resolves.toEqual({ success: false, error_message: "Access denied" });
  });

  it("returns an empty selection when no organizations are available", async () => {
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    fetch_public_data_from_convex_mock.mockResolvedValueOnce({
      success: false,
    });
    load_calendar_organizations_mock.mockResolvedValueOnce([]);

    await expect(
      load_calendar_shell_initial_data({
        is_public: true,
        current_profile_state: { status: "missing" },
        preferred_organization_id: "organization-1",
        use_cases: {} as never,
      }),
    ).resolves.toEqual({
      success: true,
      is_using_cached_data: true,
      organizations: [],
      selected_organization_id: "",
    });
  });

  it("loads the preferred organization bundle and falls back to the first organization when needed", async () => {
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    fetch_public_data_from_convex_mock.mockResolvedValue({ success: true });
    load_calendar_organizations_mock.mockResolvedValueOnce([
      { id: "organization-1" },
      { id: "organization-2" },
    ]);
    load_calendar_organization_bundle_mock.mockResolvedValueOnce({
      calendar_events: [{ id: "event-1" }],
    });

    await expect(
      load_calendar_shell_initial_data({
        is_public: true,
        current_profile_state: { status: "missing" },
        preferred_organization_id: "organization-2",
        use_cases: {} as never,
      }),
    ).resolves.toEqual({
      success: true,
      is_using_cached_data: false,
      organizations: [{ id: "organization-1" }, { id: "organization-2" }],
      selected_organization_id: "organization-2",
      bundle: { calendar_events: [{ id: "event-1" }] },
    });
  });
});
