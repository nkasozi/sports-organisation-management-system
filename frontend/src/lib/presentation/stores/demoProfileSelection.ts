import { SEED_SYSTEM_USER_IDS } from "$lib/infrastructure/utils/seed/seedIds";

import {
  AUTH_STORE_LOG_EVENTS,
  PUBLIC_VIEWER_PROFILE_ID,
} from "./authStoreConstants";
import type { AuthState, UserProfile } from "./authTypes";

const DEMO_PROFILE_IDS: ReadonlySet<string> = new Set<string>([
  PUBLIC_VIEWER_PROFILE_ID,
  ...Object.values(SEED_SYSTEM_USER_IDS),
]);

export function is_demo_profile(profile: UserProfile): boolean {
  return DEMO_PROFILE_IDS.has(profile.id);
}

export function select_demo_profiles(profiles: UserProfile[]): UserProfile[] {
  return profiles.filter(is_demo_profile);
}

export function select_profiles_for_session(
  state: AuthState,
  profiles: UserProfile[],
): UserProfile[] {
  return state.is_demo_session ? select_demo_profiles(profiles) : profiles;
}

export function is_demo_switch_permitted(
  state: AuthState,
  target_profile: UserProfile,
): boolean {
  if (state.is_demo_session && is_demo_profile(target_profile)) return true;
  console.warn(
    "[AuthStore] Profile switch is only allowed between demo profiles",
    {
      event: AUTH_STORE_LOG_EVENTS.PROFILE_SWITCH_REJECTED,
      profile_id: target_profile.id,
      is_demo_session: state.is_demo_session,
    },
  );
  return false;
}
