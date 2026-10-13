import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import type { AuthState } from "$lib/presentation/stores/auth";

import type { LiveGamesProfileState } from "./liveGamesDataLoader";
import { PRESENCE_STATUS } from "./presenceStatus";

const DEFAULT_LIVE_GAMES_ROLE = "player";

type LiveGamesTokenState =
  | { status: "missing" }
  | { status: "present"; raw_token: string };

export function get_live_games_current_profile_state(
  auth_state: Pick<AuthState, "current_profile">,
): LiveGamesProfileState {
  if (auth_state.current_profile.status !== PRESENCE_STATUS.PRESENT) {
    return { status: "missing" };
  }

  return {
    status: "present",
    profile: auth_state.current_profile.profile as unknown as UserScopeProfile,
  };
}

export function get_live_games_current_token_state(
  auth_state: Pick<AuthState, "current_token">,
): LiveGamesTokenState {
  if (auth_state.current_token.status !== PRESENCE_STATUS.PRESENT) {
    return { status: "missing" };
  }

  return {
    status: "present",
    raw_token: auth_state.current_token.token.raw_token,
  };
}

export function get_live_games_current_role(
  auth_state: Pick<AuthState, "current_profile">,
): string {
  if (auth_state.current_profile.status !== PRESENCE_STATUS.PRESENT) {
    return DEFAULT_LIVE_GAMES_ROLE;
  }

  return auth_state.current_profile.profile.role || DEFAULT_LIVE_GAMES_ROLE;
}
