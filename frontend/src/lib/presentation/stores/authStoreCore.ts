import { get, type Readable, writable } from "svelte/store";

import type { Result } from "$lib/core/types/Result";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { execute_auth_initialization } from "./authInitialize";
import {
  type AuthStoreContext,
  build_initial_auth_state,
  logout_auth_store,
  refresh_auth_profiles,
  switch_auth_profile,
} from "./authStoreActions";
import { build_auth_store_permission_accessors } from "./authStorePermissionAccessors";
import type { AuthState } from "./authTypes";

type AuthProfileRole = AuthState["available_profiles"][number]["role"];

const NO_CURRENT_ROLE = "";

type AuthStorePermissionAccessors = ReturnType<
  typeof build_auth_store_permission_accessors
>;

interface AuthStore extends Readable<AuthState>, AuthStorePermissionAccessors {
  initialize: () => Promise<Result<true>>;
  switch_profile: (
    profile_id: AuthState["available_profiles"][number]["id"],
  ) => Promise<boolean>;
  refresh_profiles: () => Promise<boolean>;
  get_current_role: () => AuthProfileRole | typeof NO_CURRENT_ROLE;
  logout: () => Promise<void>;
  reset_initialized_state: () => void;
  mark_as_demo_session: () => boolean;
  get_sidebar_menu_items: () => AuthState["sidebar_menu_items"];
}

function read_current_role(
  state: AuthState,
): AuthProfileRole | typeof NO_CURRENT_ROLE {
  const current_profile = state.current_profile;
  return current_profile.status === PRESENCE_STATUS.PRESENT
    ? current_profile.profile.role
    : NO_CURRENT_ROLE;
}

function create_auth_store(): AuthStore {
  const { subscribe, set, update } = writable<AuthState>(
    build_initial_auth_state(),
  );
  const read_state = (): AuthState => get({ subscribe });
  const context: AuthStoreContext = { read_state, set, update };

  return {
    subscribe,
    initialize: (): Promise<Result<true>> =>
      execute_auth_initialization(read_state(), set),
    switch_profile: (
      profile_id: AuthState["available_profiles"][number]["id"],
    ): Promise<boolean> => switch_auth_profile(context, profile_id),
    refresh_profiles: (): Promise<boolean> => refresh_auth_profiles(context),
    get_current_role: (): AuthProfileRole | typeof NO_CURRENT_ROLE =>
      read_current_role(read_state()),
    logout: (): Promise<void> => logout_auth_store(context),
    reset_initialized_state: (): void => {
      update((s) => ({ ...s, is_initialized: false, is_demo_session: false }));
    },
    mark_as_demo_session: (): boolean => {
      update((s) => ({ ...s, is_demo_session: true }));
      return true;
    },
    get_sidebar_menu_items: (): AuthState["sidebar_menu_items"] =>
      read_state().sidebar_menu_items,
    ...build_auth_store_permission_accessors(read_state),
  };
}

export const auth_store = create_auth_store();
