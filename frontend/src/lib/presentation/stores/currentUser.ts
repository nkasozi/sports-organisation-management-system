import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import type { SystemUser, SystemUserRole } from "$lib/core/entities/SystemUser";
import {
  EventBus,
  type EntityUpdatedPayload,
} from "$lib/infrastructure/events/EventBus";
import { get_app_settings_storage } from "$lib/infrastructure/container";

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: SystemUserRole;
  profile_picture_base64?: string;
}

const storage_key = "sports-org-current-user";

const REQUIRED_USER_FIELDS: ReadonlyArray<keyof CurrentUser> = [
  "id",
  "email",
  "first_name",
  "last_name",
  "role",
];

function validate_stored_user(
  parsed: unknown,
): parsed is CurrentUser {
  if (typeof parsed !== "object" || parsed === null) return false;
  const record = parsed as Record<string, unknown>;
  return REQUIRED_USER_FIELDS.every(
    (field) => typeof record[field] === "string" && record[field] !== "",
  );
}

function create_current_user_store() {
  const { subscribe, set, update } = writable<CurrentUser | null>(null);

  return {
    subscribe,

    initialize: async (): Promise<void> => {
      if (!browser) return;
      const stored = await get_app_settings_storage().get_setting(storage_key);
      if (!stored) return;
      try {
        const parsed: unknown = JSON.parse(stored);
        if (!validate_stored_user(parsed)) return;
        set(parsed);
      } catch {
        /* ignore corrupt data */
      }
    },

    set_user: async (user: SystemUser): Promise<void> => {
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

      set(current_user);
    },

    clear: async (): Promise<void> => {
      if (browser) {
        await get_app_settings_storage().remove_setting(storage_key);
      }
      set(null);
    },

    update_profile_picture: async (base64: string): Promise<void> => {
      const user = get({ subscribe });
      if (!user) return;
      const updated = { ...user, profile_picture_base64: base64 };
      if (browser) {
        await get_app_settings_storage().set_setting(
          storage_key,
          JSON.stringify(updated),
        );
      }
      set(updated);
    },

    update_from_entity_data: async (
      entity_data: Record<string, unknown>,
    ): Promise<void> => {
      const user = get({ subscribe });
      if (!user) return;
      const updated: CurrentUser = {
        id: user.id,
        email: (entity_data.email as string) ?? user.email,
        first_name: (entity_data.first_name as string) ?? user.first_name,
        last_name: (entity_data.last_name as string) ?? user.last_name,
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
      set(updated);
    },

    get_current_user_id: (): string | null => {
      const user = get({ subscribe });
      return user?.id ?? null;
    },
  };
}

export const current_user_store = create_current_user_store();

const current_user_display_name = derived(current_user_store, ($user) =>
  $user ? `${$user.first_name} ${$user.last_name}` : "Guest",
);

const current_user_initials = derived(current_user_store, ($user) => {
  if (!$user) return "?";
  const first_initial = $user.first_name?.charAt(0).toUpperCase() || "";
  const last_initial = $user.last_name?.charAt(0).toUpperCase() || "";
  return `${first_initial}${last_initial}` || "?";
});

function handle_system_user_updated(payload: EntityUpdatedPayload): void {
  if (payload.entity_type !== "system_user") return;

  const current_user_id = current_user_store.get_current_user_id();
  if (!current_user_id) return;

  if (payload.entity_id !== current_user_id) return;

  current_user_store.update_from_entity_data(payload.entity_data);
}

if (browser) {
  EventBus.subscribe<EntityUpdatedPayload>(
    "entity_updated",
    handle_system_user_updated,
  );
}
