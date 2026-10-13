import { describe, expect, it, vi } from "vitest";

import { PROFILE_MANAGEMENT_PAGE_EVENT } from "./profileManagementPageConstants";
import { load_profile_management_page_data } from "./profileManagementPageData";

describe("profileManagementPageData", () => {
  it("returns loaded profiles and related entity options when both requests succeed", async () => {
    const profile_use_cases = {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: "profile-1",
              profile_slug: "jane-doe",
              visibility: "public",
              status: "active",
            },
          ],
        },
      }),
    };
    const related_entity_use_cases = {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ id: "player-1", display_name: "Jane Doe" }] },
      }),
    };

    expect(
      await load_profile_management_page_data(
        {
          profile_use_cases,
          related_entity_use_cases,
          get_related_entity_label: (entity: { display_name: string }) =>
            entity.display_name,
        } as never,
        { organization_id: "organization-1" },
        "Failed to load profiles",
      ),
    ).toEqual({
      success: true,
      profiles: [
        {
          id: "profile-1",
          profile_slug: "jane-doe",
          visibility: "public",
          status: "active",
        },
      ],
      related_entity_options: [{ value: "player-1", label: "Jane Doe" }],
    });
  });

  it("returns the friendly fallback message and logs the raw error when profile loading fails", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const profile_use_cases = {
      list: vi.fn().mockResolvedValue({
        success: false,
        error: "profile list failed",
      }),
    };

    expect(
      await load_profile_management_page_data(
        {
          profile_use_cases,
          related_entity_use_cases: { list: vi.fn() },
          get_related_entity_label: () => "",
        } as never,
        {},
        "Failed to load profiles",
      ),
    ).toEqual({
      success: false,
      error_message: "Failed to load profiles",
    });
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: PROFILE_MANAGEMENT_PAGE_EVENT.PROFILES_LOAD_FAILED,
        error: "profile list failed",
      }),
    );
    error_spy.mockRestore();
  });

  it("keeps profiles when related entity loading fails and omits related options", async () => {
    const profile_use_cases = {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: "profile-1",
              profile_slug: "club",
              visibility: "private",
              status: "inactive",
            },
          ],
        },
      }),
    };
    const related_entity_use_cases = {
      list: vi.fn().mockResolvedValue({ success: false }),
    };

    expect(
      await load_profile_management_page_data(
        {
          profile_use_cases,
          related_entity_use_cases,
          get_related_entity_label: () => "",
        } as never,
        { team_id: "team-1" },
        "Failed to load profiles",
      ),
    ).toEqual({
      success: true,
      profiles: [
        {
          id: "profile-1",
          profile_slug: "club",
          visibility: "private",
          status: "inactive",
        },
      ],
      related_entity_options: [],
    });
  });
});
