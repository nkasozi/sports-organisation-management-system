import type {
  AuthenticationPort,
  DataAction,
  SystemUserRepository,
  UserRole,
} from "$lib/core/interfaces/ports";
import {
  check_entity_permission,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";
import { OptionStatus } from "$lib/core/types/Option";
import type { AsyncResult } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";

import {
  build_authorization_cache_key,
  read_authorization_cache,
} from "./authorizationCacheAccess";
import {
  resolve_token_role,
  TOKEN_ROLE_STATUS,
} from "./authTokenRoleResolution";
import {
  ALL_DATA_ACTIONS,
  AUTHORIZATION_CACHE_KEY_PREFIX,
} from "./iamConstants";

const ACTION_SELECTION = {
  ALLOWED: "allowed",
  DISABLED: "disabled",
} as const;

type ActionSelection = (typeof ACTION_SELECTION)[keyof typeof ACTION_SELECTION];

interface EntityActionsQuery {
  auth_port: AuthenticationPort;
  system_user_repository: SystemUserRepository;
  authorization_cache: AuthCache<unknown>;
  raw_token: string;
  entity_type: string;
  selection: ActionSelection;
}

export function select_actions_for_role(
  role: UserRole,
  entity_type: string,
  selection: ActionSelection,
): DataAction[] {
  const normalized = normalize_to_entity_type(entity_type);
  const wants_permitted = selection === ACTION_SELECTION.ALLOWED;
  return ALL_DATA_ACTIONS.filter(
    (action: DataAction) =>
      check_entity_permission(role, normalized, action) === wants_permitted,
  );
}

function select_actions_for_unauthenticated(
  selection: ActionSelection,
): DataAction[] {
  switch (selection) {
    case ACTION_SELECTION.ALLOWED:
      return [];
    case ACTION_SELECTION.DISABLED:
      return [...ALL_DATA_ACTIONS];
  }
}

function build_cache_prefix(selection: ActionSelection): string {
  switch (selection) {
    case ACTION_SELECTION.ALLOWED:
      return AUTHORIZATION_CACHE_KEY_PREFIX.ALLOWED_ACTIONS;
    case ACTION_SELECTION.DISABLED:
      return AUTHORIZATION_CACHE_KEY_PREFIX.DISABLED_ACTIONS;
  }
}

async function resolve_entity_actions(
  query: EntityActionsQuery,
): AsyncResult<DataAction[]> {
  const prefix = build_cache_prefix(query.selection);
  const key_parts = [query.raw_token, query.entity_type];
  const cache_key = build_authorization_cache_key(prefix, key_parts);
  const cached = read_authorization_cache<DataAction[]>(
    query.authorization_cache,
    cache_key,
    prefix,
  );
  if (cached.status === OptionStatus.SOME)
    return create_success_result(cached.value);
  const resolution = await resolve_token_role(query);
  switch (resolution.status) {
    case TOKEN_ROLE_STATUS.LOOKUP_FAILED:
      return create_failure_result(resolution.message);
    case TOKEN_ROLE_STATUS.TOKEN_INVALID:
    case TOKEN_ROLE_STATUS.TOKEN_EXPIRED:
    case TOKEN_ROLE_STATUS.USER_REJECTED:
      return create_success_result(
        select_actions_for_unauthenticated(query.selection),
      );
    case TOKEN_ROLE_STATUS.RESOLVED: {
      const actions = select_actions_for_role(
        resolution.role,
        query.entity_type,
        query.selection,
      );
      query.authorization_cache.set(cache_key, actions);
      return create_success_result(actions);
    }
  }
}

export function get_allowed_entity_actions_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
  entity_type: string,
): AsyncResult<DataAction[]> {
  return resolve_entity_actions({
    auth_port,
    system_user_repository,
    authorization_cache,
    raw_token,
    entity_type,
    selection: ACTION_SELECTION.ALLOWED,
  });
}

export function get_disabled_entity_actions_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
  entity_type: string,
): AsyncResult<DataAction[]> {
  return resolve_entity_actions({
    auth_port,
    system_user_repository,
    authorization_cache,
    raw_token,
    entity_type,
    selection: ACTION_SELECTION.DISABLED,
  });
}
