import { browser } from "$app/environment";
import type { SystemUser, SystemUserRole } from "$lib/core/entities/SystemUser";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import { get_app_settings_storage } from "$lib/infrastructure/container";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  CURRENT_USER_LOG_EVENTS,
  EMPTY_FIELD_VALUE,
  JAVASCRIPT_TYPE_NAME,
} from "./currentUserConstants";

export type CurrentUser = ScalarInput<{
  id: SystemUser["id"];
  email: SystemUser["email"];
  first_name: SystemUser["first_name"];
  last_name: SystemUser["last_name"];
  role: SystemUserRole;
  profile_picture_base64?: string;
}>;

type StoredCurrentUser = CurrentUser;

export type CurrentUserState =
  | { status: typeof PRESENCE_STATUS.PRESENT; user: CurrentUser }
  | { status: typeof PRESENCE_STATUS.MISSING };

export type CurrentUserIdentifierState =
  | { status: typeof PRESENCE_STATUS.PRESENT; user_id: CurrentUser["id"] }
  | { status: typeof PRESENCE_STATUS.MISSING };

export interface CurrentUserStoreContext {
  read_state: () => CurrentUserState;
  set: (state: CurrentUserState) => void;
}

export const CURRENT_USER_STORAGE_KEY = "sports-org-current-user";

const REQUIRED_USER_FIELDS: ReadonlyArray<keyof StoredCurrentUser> = [
  "id",
  "email",
  "first_name",
  "last_name",
  "role",
];

export function validate_stored_user(
  parsed: unknown,
): parsed is StoredCurrentUser {
  if (!parsed || typeof parsed !== JAVASCRIPT_TYPE_NAME.OBJECT) return false;
  const record = parsed as Record<string, unknown>;
  return REQUIRED_USER_FIELDS.every(
    (field) =>
      typeof record[field] === JAVASCRIPT_TYPE_NAME.STRING &&
      record[field] !== EMPTY_FIELD_VALUE,
  );
}

async function persist_current_user(user: CurrentUser): Promise<void> {
  if (!browser) return;
  await get_app_settings_storage().set_setting(
    CURRENT_USER_STORAGE_KEY,
    JSON.stringify(user),
  );
}

export async function initialize_current_user(
  context: CurrentUserStoreContext,
): Promise<void> {
  if (!browser) return;
  const stored = await get_app_settings_storage().get_setting(
    CURRENT_USER_STORAGE_KEY,
  );
  if (!stored) return;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!validate_stored_user(parsed)) return;
    context.set({
      status: PRESENCE_STATUS.PRESENT,
      user: parsed as CurrentUser,
    });
  } catch (error) {
    console.warn("[CurrentUser] Failed to parse stored user data", {
      event: CURRENT_USER_LOG_EVENTS.STORED_USER_PARSE_FAILED,
      error: String(error),
    });
  }
}

export async function set_current_user(
  context: CurrentUserStoreContext,
  user: ScalarInput<SystemUser>,
): Promise<void> {
  const current_user: CurrentUser = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    profile_picture_base64: user.profile_picture_base64,
  };
  await persist_current_user(current_user);
  context.set({ status: PRESENCE_STATUS.PRESENT, user: current_user });
}

export async function clear_current_user(
  context: CurrentUserStoreContext,
): Promise<void> {
  if (browser) {
    await get_app_settings_storage().remove_setting(CURRENT_USER_STORAGE_KEY);
  }
  context.set({ status: PRESENCE_STATUS.MISSING });
}

export async function update_current_user_profile_picture(
  context: CurrentUserStoreContext,
  base64: string,
): Promise<void> {
  const user_state = context.read_state();
  if (user_state.status !== PRESENCE_STATUS.PRESENT) return;
  const updated = {
    ...user_state.user,
    profile_picture_base64: base64,
  };
  await persist_current_user(updated);
  context.set({ status: PRESENCE_STATUS.PRESENT, user: updated });
}

function merge_entity_data_into_user(
  user: CurrentUser,
  entity_data: Record<string, unknown>,
): CurrentUser {
  return {
    id: user.id,
    email: (entity_data.email as CurrentUser["email"]) ?? user.email,
    first_name:
      (entity_data.first_name as CurrentUser["first_name"]) ?? user.first_name,
    last_name:
      (entity_data.last_name as CurrentUser["last_name"]) ?? user.last_name,
    role: (entity_data.role as SystemUserRole) ?? user.role,
    profile_picture_base64:
      (entity_data.profile_picture_base64 as string) ??
      user.profile_picture_base64,
  };
}

export async function update_current_user_from_entity_data(
  context: CurrentUserStoreContext,
  entity_data: Record<string, unknown>,
): Promise<void> {
  const user_state = context.read_state();
  if (user_state.status !== PRESENCE_STATUS.PRESENT) return;
  const updated = merge_entity_data_into_user(user_state.user, entity_data);
  await persist_current_user(updated);
  context.set({ status: PRESENCE_STATUS.PRESENT, user: updated });
}

export function read_current_user_id(
  context: CurrentUserStoreContext,
): CurrentUserIdentifierState {
  const user_state = context.read_state();

  if (user_state.status !== PRESENCE_STATUS.PRESENT) {
    return { status: PRESENCE_STATUS.MISSING };
  }

  return { status: PRESENCE_STATUS.PRESENT, user_id: user_state.user.id };
}
