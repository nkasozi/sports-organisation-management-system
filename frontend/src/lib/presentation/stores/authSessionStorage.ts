import { get_app_settings_storage } from "$lib/infrastructure/container";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type {
  SavedProfileIdState,
  SavedTokenState,
} from "./authHelperContracts";
import type { UserProfile } from "./authTypes";
import { AUTH_STORAGE_KEY, PROFILE_STORAGE_KEY } from "./authTypes";

export async function load_saved_profile_id(): Promise<SavedProfileIdState> {
  const saved_profile_id =
    await get_app_settings_storage().get_setting(PROFILE_STORAGE_KEY);

  if (!saved_profile_id) {
    return { status: PRESENCE_STATUS.MISSING };
  }

  return {
    status: PRESENCE_STATUS.PRESENT,
    profile_id: saved_profile_id as UserProfile["id"],
  };
}

export async function save_profile_id(
  profile_id: UserProfile["id"],
): Promise<void> {
  await get_app_settings_storage().set_setting(PROFILE_STORAGE_KEY, profile_id);
}

export async function load_saved_token(): Promise<SavedTokenState> {
  const saved_token =
    await get_app_settings_storage().get_setting(AUTH_STORAGE_KEY);

  if (!saved_token) {
    return { status: PRESENCE_STATUS.MISSING };
  }

  return {
    status: PRESENCE_STATUS.PRESENT,
    raw_token: saved_token,
  };
}

export async function save_token(raw_token: string): Promise<void> {
  await get_app_settings_storage().set_setting(AUTH_STORAGE_KEY, raw_token);
}

export async function clear_auth_storage(): Promise<void> {
  await get_app_settings_storage().remove_setting(AUTH_STORAGE_KEY);
  await get_app_settings_storage().remove_setting(PROFILE_STORAGE_KEY);
}

export async function clear_saved_token(): Promise<boolean> {
  await get_app_settings_storage().remove_setting(AUTH_STORAGE_KEY);
  return true;
}
