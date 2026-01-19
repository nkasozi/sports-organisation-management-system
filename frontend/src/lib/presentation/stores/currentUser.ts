import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import type { SystemUser, SystemUserRole } from "$lib/core/entities/SystemUser";
import {
  EventBus,
  type EntityUpdatedPayload,
} from "$lib/infrastructure/events/EventBus";

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: SystemUserRole;
  profile_picture_base64?: string;
}

const storage_key = "sports-org-current-user";

function load_initial_user(): CurrentUser | null {
  if (!browser) return null;

  const stored = localStorage.getItem(storage_key);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function create_current_user_store() {
  const { subscribe, set, update } = writable<CurrentUser | null>(
    load_initial_user(),
  );

  return {
    subscribe,

    set_user: (user: SystemUser): void => {
      const current_user: CurrentUser = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_picture_base64: user.profile_picture_base64,
      };

      if (browser) {
        localStorage.setItem(storage_key, JSON.stringify(current_user));
      }

      set(current_user);
    },

    clear: (): void => {
      if (browser) {
        localStorage.removeItem(storage_key);
      }
      set(null);
    },

    update_profile_picture: (base64: string): void => {
      update((user) => {
        if (!user) return null;

        const updated = { ...user, profile_picture_base64: base64 };

        if (browser) {
          localStorage.setItem(storage_key, JSON.stringify(updated));
        }

        return updated;
      });
    },

    update_from_entity_data: (entity_data: Record<string, unknown>): void => {
      update((user) => {
        if (!user) return null;

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
          localStorage.setItem(storage_key, JSON.stringify(updated));
        }

        return updated;
      });
    },

    get_current_user_id: (): string | null => {
      const user = get({ subscribe });
      return user?.id ?? null;
    },
  };
}

export const current_user_store = create_current_user_store();

export const current_user_display_name = derived(current_user_store, ($user) =>
  $user ? `${$user.first_name} ${$user.last_name}` : "Guest",
);

export const current_user_initials = derived(current_user_store, ($user) => {
  if (!$user) return "?";
  const first_initial = $user.first_name?.charAt(0).toUpperCase() || "";
  const last_initial = $user.last_name?.charAt(0).toUpperCase() || "";
  return `${first_initial}${last_initial}` || "?";
});

export const current_user_role_display = derived(
  current_user_store,
  ($user) => {
    if (!$user) return "Guest";

    const role_display_map: Record<SystemUserRole, string> = {
      super_admin: "Super Administrator",
      admin: "Administrator",
      manager: "Manager",
      user: "User",
    };

    return role_display_map[$user.role] || "User";
  },
);

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
