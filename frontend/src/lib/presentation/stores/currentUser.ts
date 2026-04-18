import { derived, get, writable } from "svelte/store";

import { browser } from "$app/environment";
import type { SystemUser, SystemUserRole } from "$lib/core/entities/SystemUser";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import { get_app_settings_storage } from "$lib/infrastructure/container";
import {
  type EntityUpdatedPayload,
  EventBus,
} from "$lib/infrastructure/events/EventBus";

type CurrentUser = ScalarInput<{
  id: SystemUser["id"];
  email: SystemUser["email"];
  first_name: SystemUser["first_name"];
  last_name: SystemUser["last_name"];
  role: SystemUserRole;
  profile_picture_base64?: string;
}>;

type StoredCurrentUser = CurrentUser;
type CurrentUserState =
  | { status: "present"; user: CurrentUser }
  | { status: "missing" };
type CurrentUserIdentifierState =
  | { status: "present"; user_id: CurrentUser["id"] }
  | { status: "missing" };

const storage_key = "sports-org-current-user";

const REQUIRED_USER_FIELDS: ReadonlyArray<keyof StoredCurrentUser> = [
  "id",
  "email",
  "first_name",
  "last_name",
  "role",
];

function validate_stored_user(parsed: unknown): parsed is StoredCurrentUser {
  if (!parsed || typeof parsed !== "object") return false;
  const record = parsed as Record<string, unknown>;
  return REQUIRED_USER_FIELDS.every(
    (field) => typeof record[field] === "string" && record[field] !== "",
  );
}

function create_current_user_store() {
  const { subscribe, set } = writable<CurrentUserState>({
    status: "missing",
  });

  return {
    subscribe,

    initialize: async (): Promise<void> => {
      if (!browser) return;
      const stored = await get_app_settings_storage().get_setting(storage_key);
      if (!stored) return;
      try {
        const parsed: unknown = JSON.parse(stored);
        if (!validate_stored_user(parsed)) return;
        set({ status: "present", user: parsed as CurrentUser });
      } catch (error) {
        console.warn("[CurrentUser] Failed to parse stored user data", {
          event: "stored_user_parse_failed",
          error: String(error),
        });
      }
    },

    set_user: async (user: ScalarInput<SystemUser>): Promise<void> => {
      const current_user: CurrentUser = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_picture_base64: user.profile_picture_base64,
      };

      if (browser) {
        await get_app_settings_storage().set_setting(
          storage_key,
          JSON.stringify(current_user),
        );
      }

      set({ status: "present", user: current_user });
    },

    clear: async (): Promise<void> => {
      if (browser) {
        await get_app_settings_storage().remove_setting(storage_key);
      }
      set({ status: "missing" });
    },

    update_profile_picture: async (base64: string): Promise<void> => {
      const user_state = get({ subscribe });
      if (user_state.status !== "present") return;
      const updated = {
        ...user_state.user,
        profile_picture_base64: base64,
      };
      if (browser) {
        await get_app_settings_storage().set_setting(
          storage_key,
          JSON.stringify(updated),
        );
      }
      set({ status: "present", user: updated });
    },

    update_from_entity_data: async (
      entity_data: Record<string, unknown>,
    ): Promise<void> => {
      const user_state = get({ subscribe });
      if (user_state.status !== "present") return;
      const user = user_state.user;
      const updated: CurrentUser = {
        id: user.id,
        email: (entity_data.email as CurrentUser["email"]) ?? user.email,
        first_name:
          (entity_data.first_name as CurrentUser["first_name"]) ??
          user.first_name,
        last_name:
          (entity_data.last_name as CurrentUser["last_name"]) ?? user.last_name,
        role: (entity_data.role as SystemUserRole) ?? user.role,
        profile_picture_base64:
          (entity_data.profile_picture_base64 as string) ??
          user.profile_picture_base64,
      };
      if (browser) {
        await get_app_settings_storage().set_setting(
          storage_key,
          JSON.stringify(updated),
        );
      }
      set({ status: "present", user: updated });
    },

    get_current_user_id: (): CurrentUserIdentifierState => {
      const user_state = get({ subscribe });

      if (user_state.status !== "present") {
        return { status: "missing" };
      }

      return { status: "present", user_id: user_state.user.id };
    },
  };
}

export const current_user_store = create_current_user_store();

const current_user_display_name = derived(current_user_store, ($user) =>
  $user.status === "present"
    ? `${$user.user.first_name} ${$user.user.last_name}`
    : "Guest",
);

const current_user_initials = derived(current_user_store, ($user) => {
  if ($user.status !== "present") return "?";
  const first_initial = $user.user.first_name?.charAt(0).toUpperCase() || "";
  const last_initial = $user.user.last_name?.charAt(0).toUpperCase() || "";
  return `${first_initial}${last_initial}` || "?";
});

function handle_system_user_updated(payload: EntityUpdatedPayload): void {
  if (payload.entity_type !== "system_user") return;

  const current_user_id_state = current_user_store.get_current_user_id();
  if (current_user_id_state.status !== "present") return;

  if (payload.entity_id !== current_user_id_state.user_id) return;

  current_user_store.update_from_entity_data(payload.entity_data);
}

if (browser) {
  EventBus.subscribe<EntityUpdatedPayload>(
    "entity_updated",
    handle_system_user_updated,
  );
}
