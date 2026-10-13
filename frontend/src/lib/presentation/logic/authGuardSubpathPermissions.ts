import type { SharedEntityType } from "$convex/shared_permission_definitions";
import {
  type DataAction,
  get_role_permissions,
  type UserRole,
} from "$lib/core/interfaces/ports";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import { DATA_ACTION } from "$lib/presentation/stores/authPermissionConstants";
import { check_entity_permission } from "$lib/presentation/stores/authPermissionCore";

const ROUTE_SUBPATH_REQUIREMENT_STATUS = {
  NOT_REQUIRED: "not_required",
  REQUIRED: "required",
  UNVERIFIABLE: "unverifiable",
} as const;

type RouteSubpathRequirement =
  | { status: typeof ROUTE_SUBPATH_REQUIREMENT_STATUS.NOT_REQUIRED }
  | { status: typeof ROUTE_SUBPATH_REQUIREMENT_STATUS.UNVERIFIABLE }
  | {
      status: typeof ROUTE_SUBPATH_REQUIREMENT_STATUS.REQUIRED;
      entity_type: SharedEntityType;
      action: DataAction;
    };

const CREATE_ROUTE_SEGMENTS: ReadonlySet<string> = new Set([
  "create",
  "bulk-assign",
]);
const UPDATE_ROUTE_SEGMENTS: ReadonlySet<string> = new Set([
  "edit",
  "constraints",
]);
const CREATE_SEGMENT_INDEX = 1;
const UPDATE_SEGMENT_INDEX = 2;
const SUBPATH_UNVERIFIABLE_EVENT = "auth_guard_route_subpath_unverifiable";

const ROUTE_BASE_ENTITY_TYPES: Readonly<Record<string, SharedEntityType>> = {
  competitions: "competition",
  sports: "sport",
  "fixture-lineups": "fixturelineup",
  "player-team-memberships": "playerteammembership",
  fixtures: "fixture",
  teams: "team",
  players: "player",
  officials: "official",
  venues: "venue",
  organizations: "organization",
};

const NOT_REQUIRED: RouteSubpathRequirement = {
  status: ROUTE_SUBPATH_REQUIREMENT_STATUS.NOT_REQUIRED,
};

function resolve_subpath_action(segments: string[]): Option<DataAction> {
  if (CREATE_ROUTE_SEGMENTS.has(segments[CREATE_SEGMENT_INDEX] ?? "")) {
    return create_some_option<DataAction>(DATA_ACTION.CREATE);
  }
  return UPDATE_ROUTE_SEGMENTS.has(segments[UPDATE_SEGMENT_INDEX] ?? "")
    ? create_some_option<DataAction>(DATA_ACTION.UPDATE)
    : create_none_option<DataAction>();
}

export function resolve_route_subpath_requirement(
  pathname: string,
): RouteSubpathRequirement {
  const segments = pathname.split("/").filter(Boolean);
  const action_option = resolve_subpath_action(segments);
  if (action_option.status === OptionStatus.NONE) return NOT_REQUIRED;
  const route_base_segment = segments[0];
  if (!Object.hasOwn(ROUTE_BASE_ENTITY_TYPES, route_base_segment)) {
    return { status: ROUTE_SUBPATH_REQUIREMENT_STATUS.UNVERIFIABLE };
  }
  return {
    status: ROUTE_SUBPATH_REQUIREMENT_STATUS.REQUIRED,
    entity_type: ROUTE_BASE_ENTITY_TYPES[route_base_segment],
    action: action_option.value,
  };
}

export function is_role_permitted_for_route_subpath(
  role: UserRole,
  pathname: string,
): boolean {
  const requirement = resolve_route_subpath_requirement(pathname);
  switch (requirement.status) {
    case ROUTE_SUBPATH_REQUIREMENT_STATUS.NOT_REQUIRED:
      return true;
    case ROUTE_SUBPATH_REQUIREMENT_STATUS.UNVERIFIABLE:
      console.warn("[AuthGuard] Route action subpath cannot be verified", {
        event: SUBPATH_UNVERIFIABLE_EVENT,
        pathname,
        role,
      });
      return false;
    case ROUTE_SUBPATH_REQUIREMENT_STATUS.REQUIRED:
      return check_entity_permission(
        role,
        requirement.entity_type,
        requirement.action,
        get_role_permissions(role),
      );
  }
}
