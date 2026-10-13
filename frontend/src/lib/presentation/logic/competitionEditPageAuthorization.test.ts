import { describe, expect, it, vi } from "vitest";

import {
  authorize_competition_edit_page,
  build_competition_edit_current_profile_state,
  build_competition_edit_raw_token_state,
} from "./competitionEditPageAuthorization";

function create_adapter(
  results: Array<{ success: boolean; data?: { is_authorized: boolean } }>,
): { check_entity_authorized: ReturnType<typeof vi.fn> } {
  const check_entity_authorized = vi.fn();
  for (const result of results) {
    check_entity_authorized.mockResolvedValueOnce(result);
  }
  return { check_entity_authorized };
}

describe("competitionEditPageAuthorization", () => {
  it("builds profile and token states from the auth state", () => {
    expect(
      build_competition_edit_current_profile_state({
        current_profile: { status: "missing" },
      } as never),
    ).toEqual({ status: "missing" });
    expect(
      build_competition_edit_current_profile_state({
        current_profile: { status: "present", profile: { id: "p" } },
      } as never),
    ).toEqual({ status: "present", profile: { id: "p" } });
    expect(
      build_competition_edit_raw_token_state({
        current_token: { status: "missing" },
      } as never),
    ).toEqual({ status: "missing" });
    expect(
      build_competition_edit_raw_token_state({
        current_token: { status: "present", token: { raw_token: "t" } },
      } as never),
    ).toEqual({ status: "present", raw_token: "t" });
  });

  it("proceeds without edit access when no token exists", async () => {
    const adapter = create_adapter([]);
    await expect(
      authorize_competition_edit_page({
        raw_token_state: { status: "missing" },
        get_authorization_adapter: () => adapter as never,
        deny_access: vi.fn(),
      }),
    ).resolves.toEqual({
      status: "proceed",
      can_edit_competition: false,
      permission_info_message: "",
    });
    expect(adapter.check_entity_authorized).not.toHaveBeenCalled();
  });

  it("halts when the read check fails or is denied", async () => {
    const deny_access = vi.fn();
    await expect(
      authorize_competition_edit_page({
        raw_token_state: { status: "present", raw_token: "t" },
        get_authorization_adapter: () =>
          create_adapter([{ success: false }]) as never,
        deny_access,
      }),
    ).resolves.toEqual({ status: "halted" });
    expect(deny_access).not.toHaveBeenCalled();
    await expect(
      authorize_competition_edit_page({
        raw_token_state: { status: "present", raw_token: "t" },
        get_authorization_adapter: () =>
          create_adapter([
            { success: true, data: { is_authorized: false } },
          ]) as never,
        deny_access,
      }),
    ).resolves.toEqual({ status: "halted" });
    expect(deny_access).toHaveBeenCalledTimes(1);
  });

  it("logs structured events when the page is halted", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await authorize_competition_edit_page({
      raw_token_state: { status: "present", raw_token: "t" },
      get_authorization_adapter: () =>
        create_adapter([
          { success: false, error: "offline" },
        ] as never) as never,
      deny_access: vi.fn(),
    });
    await authorize_competition_edit_page({
      raw_token_state: { status: "present", raw_token: "t" },
      get_authorization_adapter: () =>
        create_adapter([
          { success: true, data: { is_authorized: false } },
        ]) as never,
      deny_access: vi.fn(),
    });

    expect(warn_spy.mock.calls.map((call) => call[1])).toEqual([
      expect.objectContaining({
        event: "competition_edit_read_authorization_check_failed",
      }),
      expect.objectContaining({
        event: "competition_edit_read_access_denied",
      }),
    ]);
    warn_spy.mockRestore();
  });

  it("derives edit access from the update check", async () => {
    const adapter = create_adapter([
      { success: true, data: { is_authorized: true } },
      { success: true, data: { is_authorized: false } },
    ]);
    await expect(
      authorize_competition_edit_page({
        raw_token_state: { status: "present", raw_token: "t" },
        get_authorization_adapter: () => adapter as never,
        deny_access: vi.fn(),
      }),
    ).resolves.toEqual({
      status: "proceed",
      can_edit_competition: false,
      permission_info_message:
        "You have view-only access to this competition. Editing is not available.",
    });
    expect(adapter.check_entity_authorized).toHaveBeenNthCalledWith(
      2,
      "t",
      "competition",
      "update",
    );
    const editable = create_adapter([
      { success: true, data: { is_authorized: true } },
      { success: true, data: { is_authorized: true } },
    ]);
    await expect(
      authorize_competition_edit_page({
        raw_token_state: { status: "present", raw_token: "t" },
        get_authorization_adapter: () => editable as never,
        deny_access: vi.fn(),
      }),
    ).resolves.toEqual({
      status: "proceed",
      can_edit_competition: true,
      permission_info_message: "",
    });
  });
});
