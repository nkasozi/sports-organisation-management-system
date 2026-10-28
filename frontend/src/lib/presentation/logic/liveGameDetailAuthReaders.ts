import { get } from "svelte/store";

import { find_table_official_role_ids } from "$lib/core/entities/GameOfficialRoleTable";
import { USER_ROLE_DISPLAY_NAMES } from "$lib/core/interfaces/ports";
import { get_game_official_role_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
import { auth_store } from "$lib/presentation/stores/auth";
import { is_public_viewer } from "$lib/presentation/stores/authDerivedStores";

import type { LiveGameIdentity } from "./liveGameControl";
import { PRESENCE_STATUS } from "./presenceStatus";

const NO_TOKEN = "";

export function read_live_game_raw_token(): string {
  const token_state = get(auth_store).current_token;
  return token_state.status === PRESENCE_STATUS.PRESENT
    ? token_state.token.raw_token
    : NO_TOKEN;
}

export function read_is_public_viewer(): boolean {
  return get(is_public_viewer);
}

async function load_table_role_ids(
  organization_id: string,
): Promise<ReadonlySet<string>> {
  const roles_result = await get_game_official_role_use_cases().list({
    organization_id,
  } as never);
  return roles_result.success
    ? find_table_official_role_ids(roles_result.data.items)
    : new Set();
}

export async function read_live_game_identity(
  organization_id: string,
): Promise<LiveGameIdentity> {
  const profile_state = get(auth_store).current_profile;
  const profile =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile
      : false;
  return {
    role: profile ? profile.role : "",
    official_id: profile ? String(profile.official_id ?? "") : "",
    display_name: profile ? profile.display_name : "",
    role_label: profile ? USER_ROLE_DISPLAY_NAMES[profile.role] : "",
    table_role_ids: await load_table_role_ids(organization_id),
  };
}
