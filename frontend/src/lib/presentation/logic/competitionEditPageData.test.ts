import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_competition_edit_auth_filter,
  load_competition_edit_sport,
} from "./competitionEditPageData";

const {
  build_authorization_list_filter_mock,
  create_competition_update_form_data_mock,
  get_sport_by_id_mock,
} = vi.hoisted(() => ({
  build_authorization_list_filter_mock: vi.fn(),
  create_competition_update_form_data_mock: vi.fn(),
  get_sport_by_id_mock: vi.fn(),
}));

vi.mock("$lib/core/interfaces/ports", async () => {
  const actual = await vi.importActual<
    typeof import("$lib/core/interfaces/ports")
  >("$lib/core/interfaces/ports");
  return {
    ...actual,
    build_authorization_list_filter: build_authorization_list_filter_mock,
  };
});

vi.mock("$lib/adapters/persistence/sportService", () => ({
  get_sport_by_id: get_sport_by_id_mock,
}));

vi.mock("./competitionEditPageState", () => ({
  create_competition_update_form_data: create_competition_update_form_data_mock,
}));

describe("competitionEditPageData", () => {
  beforeEach(() => {
    build_authorization_list_filter_mock.mockReset();
    create_competition_update_form_data_mock.mockReset();
    get_sport_by_id_mock.mockReset();
  });

  it("builds the auth filter from the current profile and leaves anonymous access unfiltered", () => {
    build_authorization_list_filter_mock.mockReturnValue({
      organization_id: "organization-1",
    });

    expect(build_competition_edit_auth_filter({ status: "missing" })).toEqual(
      {},
    );
    expect(
      build_competition_edit_auth_filter({
        status: "present",
        profile: {
          organization_id: "organization-1",
          team_id: "",
        } as never,
      }),
    ).toEqual({ organization_id: "organization-1" });
  });

  it("loads the selected organization sport only when the organization exposes a valid sport", async () => {
    await expect(
      load_competition_edit_sport(
        [{ id: "organization-1" }] as never,
        "organization-1",
      ),
    ).resolves.toEqual({
      success: false,
      error: "Organization sport is unavailable",
    });

    get_sport_by_id_mock.mockResolvedValueOnce({
      success: false,
      error: "Sport not found: id=sport-1",
    });
    await expect(
      load_competition_edit_sport(
        [{ id: "organization-1", sport_id: "sport-1" }] as never,
        "organization-1",
      ),
    ).resolves.toEqual({
      success: false,
      error: "Sport not found: id=sport-1",
    });

    get_sport_by_id_mock.mockResolvedValueOnce({
      success: true,
      data: { id: "sport-1", name: "Football" },
    });
    await expect(
      load_competition_edit_sport(
        [{ id: "organization-1", sport_id: "sport-1" }] as never,
        "organization-1",
      ),
    ).resolves.toEqual({
      success: true,
      data: { id: "sport-1", name: "Football" },
    });
  });
});
