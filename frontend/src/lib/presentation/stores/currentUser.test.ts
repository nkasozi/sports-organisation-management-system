import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { current_user_store } from "./currentUser";

const current_user_mocks = vi.hoisted(() => {
  let entity_updated_handler:
    | ((payload: Record<string, unknown>) => void)
    | undefined;

  return {
    get_setting: vi.fn(),
    set_setting: vi.fn(),
    remove_setting: vi.fn(),
    subscribe: vi.fn(
      (
        _event_type: string,
        handler: (payload: Record<string, unknown>) => void,
      ) => {
        entity_updated_handler = handler;
        return { unsubscribe: vi.fn() };
      },
    ),
    emit_entity_updated: async (
      payload: Record<string, unknown>,
    ): Promise<void> => {
      entity_updated_handler?.(payload);
      await Promise.resolve();
    },
  };
});

vi.mock("$app/environment", () => ({
  browser: true,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: current_user_mocks.get_setting,
    set_setting: current_user_mocks.set_setting,
    remove_setting: current_user_mocks.remove_setting,
  }),
}));

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: {
    subscribe: current_user_mocks.subscribe,
  },
}));

describe("currentUser", () => {
  beforeEach(async () => {
    current_user_mocks.get_setting.mockReset();
    current_user_mocks.set_setting.mockReset();
    current_user_mocks.remove_setting.mockReset();
    await current_user_store.clear();
    current_user_mocks.remove_setting.mockReset();
  });

  it("loads valid stored user data during initialization", async () => {
    current_user_mocks.get_setting.mockResolvedValue(
      JSON.stringify({
        id: "user-1",
        email: "jane@example.test",
        first_name: "Jane",
        last_name: "Doe",
        role: "org_admin",
      }),
    );

    await current_user_store.initialize();

    expect(get(current_user_store)).toEqual({
      status: "present",
      user: {
        id: "user-1",
        email: "jane@example.test",
        first_name: "Jane",
        last_name: "Doe",
        role: "org_admin",
      },
    });
    expect(current_user_store.get_current_user_id()).toEqual({
      status: "present",
      user_id: "user-1",
    });
  });

  it("persists user changes and clears them from storage", async () => {
    await current_user_store.set_user({
      id: "user-2",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      email: "alex@example.test",
      first_name: "Alex",
      last_name: "Stone",
      role: "team_manager",
      status: "active",
      organization_id: "organization-1",
    });

    expect(current_user_mocks.set_setting).toHaveBeenNthCalledWith(
      1,
      "sports-org-current-user",
      JSON.stringify({
        id: "user-2",
        email: "alex@example.test",
        first_name: "Alex",
        last_name: "Stone",
        role: "team_manager",
      }),
    );

    await current_user_store.update_profile_picture("base64-image");
    expect(get(current_user_store)).toEqual({
      status: "present",
      user: {
        id: "user-2",
        email: "alex@example.test",
        first_name: "Alex",
        last_name: "Stone",
        role: "team_manager",
        profile_picture_base64: "base64-image",
      },
    });

    await current_user_store.clear();
    expect(current_user_mocks.remove_setting).toHaveBeenCalledWith(
      "sports-org-current-user",
    );
    expect(get(current_user_store)).toEqual({ status: "missing" });
  });

  it("updates the current user from matching entity update events", async () => {
    await current_user_store.set_user({
      id: "user-3",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      email: "sam@example.test",
      first_name: "Sam",
      last_name: "Reed",
      role: "org_admin",
      status: "active",
      organization_id: "organization-1",
    });

    await current_user_mocks.emit_entity_updated({
      entity_type: "team",
      entity_id: "user-3",
      entity_data: { first_name: "Ignored" },
    });
    expect(get(current_user_store)).toEqual(
      expect.objectContaining({
        status: "present",
        user: expect.objectContaining({ first_name: "Sam" }),
      }),
    );

    await current_user_mocks.emit_entity_updated({
      entity_type: "system_user",
      entity_id: "another-user",
      entity_data: { first_name: "Ignored" },
    });
    expect(get(current_user_store)).toEqual(
      expect.objectContaining({
        status: "present",
        user: expect.objectContaining({ first_name: "Sam" }),
      }),
    );

    await current_user_mocks.emit_entity_updated({
      entity_type: "system_user",
      entity_id: "user-3",
      entity_data: {
        first_name: "Samuel",
        last_name: "Rivera",
        role: "team_manager",
      },
    });

    expect(get(current_user_store)).toEqual({
      status: "present",
      user: {
        id: "user-3",
        email: "sam@example.test",
        first_name: "Samuel",
        last_name: "Rivera",
        role: "team_manager",
      },
    });
  });
});
