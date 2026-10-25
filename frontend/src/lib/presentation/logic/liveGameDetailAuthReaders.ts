import { get } from "svelte/store";

import { auth_store } from "$lib/presentation/stores/auth";
import { is_public_viewer } from "$lib/presentation/stores/authDerivedStores";

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
