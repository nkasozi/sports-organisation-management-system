import {
  type ConvexContext,
  type ConvexResult,
  require_auth,
  type SystemUserRecord,
} from "./lib/auth_middleware";
import { is_number } from "./lib/value_guards";
import type {
  SharedDataCategory,
  SharedUserRole,
} from "./shared_permission_definitions";

export {
  check_permission as check_role_permission,
  DataAction,
  list_permitted_actions as get_actions_from_permissions,
  get_entity_data_category,
} from "./lib/permission_checks";

export type UserRole = SharedUserRole;
export type DataCategory = SharedDataCategory;

export type AuthorizationResult =
  | {
      is_authorized: true;
      user_role: string;
      data_category: DataCategory;
    }
  | {
      is_authorized: false;
      user_role: string;
      data_category: DataCategory;
      reason: string;
    };

export interface SystemUser {
  local_id?: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  status?: string;
  version: number;
}

const NO_SERVER_VERSION = 0;

function to_system_user(system_user: SystemUserRecord): SystemUser {
  return {
    local_id: system_user.local_id,
    email: system_user.email,
    name: system_user.name,
    first_name: system_user.first_name,
    last_name: system_user.last_name,
    role: system_user.role,
    organization_id: system_user.organization_id,
    team_id: system_user.team_id,
    player_id: system_user.player_id,
    official_id: system_user.official_id,
    status: system_user.status,
    version: is_number(system_user.version)
      ? system_user.version
      : NO_SERVER_VERSION,
  };
}

export async function get_system_user_from_context(
  ctx: ConvexContext,
): Promise<ConvexResult<SystemUser>> {
  const auth_result = await require_auth(ctx);
  return auth_result.success
    ? { success: true, data: to_system_user(auth_result.data) }
    : auth_result;
}
