import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_calendar_page_shell_controller_runtime } from "./calendarPageShellControllerRuntime";
import { create_calendar_shell_command } from "./calendarPageShellControllerRuntime.test_support";

const {
  fetch_public_data_from_convex_mock,
  get_store_value_mock,
  is_public_viewer_store,
  load_calendar_shell_bundle_mock,
} = vi.hoisted(() => ({
  fetch_public_data_from_convex_mock: vi.fn(),
  get_store_value_mock: vi.fn(),
  is_public_viewer_store: { kind: "is_public_viewer" },
  load_calendar_shell_bundle_mock: vi.fn(),
}));

vi.mock("svelte/store", () => ({ get: get_store_value_mock }));

vi.mock("$lib/presentation/logic/calendarPageShellControllerData", () => ({
  load_calendar_shell_bundle: load_calendar_shell_bundle_mock,
  load_calendar_shell_events: vi.fn(),
}));

vi.mock(
  "$lib/presentation/logic/calendarPageShellControllerInitialData",
  () => ({ load_calendar_shell_initial_data: vi.fn() }),
);

vi.mock(
  "$lib/presentation/logic/calendarPageShellControllerRuntimeActivity",
  () => ({
    create_calendar_page_shell_controller_activity_actions: () => ({}),
  }),
);

vi.mock("$lib/presentation/stores/auth", () => ({
  is_public_viewer: is_public_viewer_store,
}));

vi.mock("$lib/presentation/stores/publicOrganization", () => ({
  public_organization_store: { set_organization: vi.fn() },
}));

vi.mock("$lib/infrastructure/sync/convexPublicDataService", () => ({
  fetch_public_data_from_convex: fetch_public_data_from_convex_mock,
}));

function use_public_viewer(is_public: boolean): void {
  get_store_value_mock.mockImplementation((store: unknown) =>
    store === is_public_viewer_store ? is_public : {},
  );
}

describe("calendar organization change public data", () => {
  beforeEach(() => {
    fetch_public_data_from_convex_mock.mockReset();
    load_calendar_shell_bundle_mock.mockReset();
    load_calendar_shell_bundle_mock.mockResolvedValue({
      teams: [],
      competitions: [],
      categories: [],
      calendar_events: [],
    });
  });

  it("pulls the newly selected organization's public data for public viewers", async () => {
    use_public_viewer(true);
    fetch_public_data_from_convex_mock.mockResolvedValueOnce({
      success: false,
    });
    const { command } = create_calendar_shell_command();
    const runtime = create_calendar_page_shell_controller_runtime(
      command as never,
    );

    await runtime.handle_organization_change();

    expect(fetch_public_data_from_convex_mock).toHaveBeenCalledWith(
      "calendar",
      { status: "some", value: "organization-1" },
    );
    expect(command.set_is_using_cached_data).toHaveBeenCalledWith(true);
    expect(load_calendar_shell_bundle_mock).toHaveBeenCalled();
  });

  it("does not pull public data for signed-in viewers", async () => {
    use_public_viewer(false);
    const { command } = create_calendar_shell_command();
    const runtime = create_calendar_page_shell_controller_runtime(
      command as never,
    );

    await runtime.handle_organization_change();

    expect(fetch_public_data_from_convex_mock).not.toHaveBeenCalled();
  });
});
