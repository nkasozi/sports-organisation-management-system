import type { Option } from "$lib/core/types/Option";
import type { AuthState } from "$lib/presentation/stores/auth";
import { PUBLIC_VIEWER_ROLE } from "$lib/presentation/stores/authStoreConstants";

import { PRESENCE_STATUS } from "./presenceStatus";
import { build_public_organization_scope } from "./publicDataOrganizationScope";

export interface LiveGamesPublicDataLoader {
  load_public_live_games_data(
    organization_scope: Option<string>,
  ): Promise<{ success: boolean }>;
}

const NO_ORGANIZATION = "";

export function is_public_viewer_profile(
  auth_state: Pick<AuthState, "current_profile">,
): boolean {
  return (
    auth_state.current_profile.status === PRESENCE_STATUS.PRESENT &&
    auth_state.current_profile.profile.role === PUBLIC_VIEWER_ROLE
  );
}

export async function load_public_live_games_data_when_public(
  loader: LiveGamesPublicDataLoader,
  auth_state: Pick<AuthState, "current_profile">,
  organization_id: string = NO_ORGANIZATION,
): Promise<boolean> {
  if (!is_public_viewer_profile(auth_state)) return false;
  const result = await loader.load_public_live_games_data(
    build_public_organization_scope(organization_id),
  );
  return result.success;
}
