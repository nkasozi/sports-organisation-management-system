import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CURRENT_USER_STORAGE_KEY,
  type CurrentUserState,
  type CurrentUserStoreContext,
  initialize_current_user,
  read_current_user_id,
  update_current_user_from_entity_data,
  update_current_user_profile_picture,
  validate_stored_user,
} from "./currentUserStoreActions";

const current_user_action_mocks = vi.hoisted(() => ({
  get_setting: vi.fn(),
  set_setting: vi.fn(),
}));

vi.mock("$app/environment", () => ({ browser: true }));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: current_user_action_mocks.get_setting,
    set_setting: current_user_action_mocks.set_setting,
  }),
}));

function build_context(initial_state: CurrentUserState): {
  context: CurrentUserStoreContext;
  read: () => CurrentUserState;
} {
  let state = initial_state;
  return {
    context: {
      read_state: () => state,
      set: (next_state: CurrentUserState) => {
        state = next_state;
      },
    },
    read: () => state,
  };
}

describe("currentUserStoreActions", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    current_user_action_mocks.get_setting.mockReset();
    current_user_action_mocks.set_setting.mockReset();
  });

  it("validates required stored user fields", () => {
    expect(validate_stored_user(undefined)).toBe(false);
    expect(validate_stored_user({ id: "user-1" })).toBe(false);
    expect(
      validate_stored_user({
        id: "user-1",
        email: "a@b.test",
        first_name: "A",
        last_name: "B",
        role: "player",
      }),
    ).toBe(true);
  });

  it("ignores unparseable or invalid stored user data", async () => {
    const harness = build_context({ status: "missing" });
    current_user_action_mocks.get_setting.mockResolvedValueOnce("{not-json");
    await initialize_current_user(harness.context);
    current_user_action_mocks.get_setting.mockResolvedValueOnce(
      JSON.stringify({ id: "user-1" }),
    );
    await initialize_current_user(harness.context);

    expect(current_user_action_mocks.get_setting).toHaveBeenCalledWith(
      CURRENT_USER_STORAGE_KEY,
    );
    expect(harness.read()).toEqual({ status: "missing" });
  });

  it("does nothing for updates when no user is present", async () => {
    const harness = build_context({ status: "missing" });

    await update_current_user_profile_picture(harness.context, "image");
    await update_current_user_from_entity_data(harness.context, {
      first_name: "X",
    });

    expect(harness.read()).toEqual({ status: "missing" });
    expect(read_current_user_id(harness.context)).toEqual({
      status: "missing",
    });
    expect(current_user_action_mocks.set_setting).not.toHaveBeenCalled();
  });
});
