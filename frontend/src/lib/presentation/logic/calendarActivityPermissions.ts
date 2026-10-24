import type { SharedEntityType } from "$convex/shared_permission_definitions";
import { ACTIVITY_SOURCE_TYPE } from "$lib/core/entities/StatusConstants";
import {
  type DataAction,
  get_role_permissions,
  type UserRole,
} from "$lib/core/interfaces/ports";
import type { CalendarProfileState } from "$lib/presentation/logic/calendarPageData";
import { can_user_add_activities } from "$lib/presentation/logic/calendarPageShellControllerHelpers";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import { DATA_ACTION } from "$lib/presentation/stores/authPermissionConstants";
import { check_entity_permission } from "$lib/presentation/stores/authPermissionCore";
import type { AuthProfileState } from "$lib/presentation/stores/authTypes";

export interface CalendarActivityPermissions {
  can_create_activity: boolean;
  can_edit_activity: boolean;
  can_delete_activity: boolean;
  can_create_category: boolean;
}

const CALENDAR_ENTITY_TYPE = {
  ACTIVITY: "activity",
  ACTIVITY_CATEGORY: "activitycategory",
} as const satisfies Record<string, SharedEntityType>;

export const CALENDAR_PAGE_SUBTITLES = {
  MANAGE: "View and manage activities, competitions, and fixtures",
  READ_ONLY: "View activities, competitions and fixtures",
} as const;

export const CALENDAR_PERMISSION_DENIED_MESSAGES = {
  EDIT_ACTIVITY: "You do not have permission to change activities.",
  DELETE_ACTIVITY: "You do not have permission to delete activities.",
  CREATE_CATEGORY: "You do not have permission to create categories.",
} as const;

function create_read_only_calendar_activity_permissions(): CalendarActivityPermissions {
  return {
    can_create_activity: false,
    can_edit_activity: false,
    can_delete_activity: false,
    can_create_category: false,
  };
}

function is_role_permitted(
  role: UserRole,
  entity_type: SharedEntityType,
  action: DataAction,
): boolean {
  return check_entity_permission(
    role,
    entity_type,
    action,
    get_role_permissions(role),
  );
}

export function build_calendar_activity_permissions(
  profile_state: AuthProfileState,
): CalendarActivityPermissions {
  if (profile_state.status !== PRESENCE_STATUS.PRESENT)
    return create_read_only_calendar_activity_permissions();
  const role: UserRole = profile_state.profile.role;
  return {
    can_create_activity: is_role_permitted(
      role,
      CALENDAR_ENTITY_TYPE.ACTIVITY,
      DATA_ACTION.CREATE,
    ),
    can_edit_activity: is_role_permitted(
      role,
      CALENDAR_ENTITY_TYPE.ACTIVITY,
      DATA_ACTION.UPDATE,
    ),
    can_delete_activity: is_role_permitted(
      role,
      CALENDAR_ENTITY_TYPE.ACTIVITY,
      DATA_ACTION.DELETE,
    ),
    can_create_category: is_role_permitted(
      role,
      CALENDAR_ENTITY_TYPE.ACTIVITY_CATEGORY,
      DATA_ACTION.CREATE,
    ),
  };
}

export function can_user_create_calendar_activities(
  profile_state: CalendarProfileState,
  permissions: CalendarActivityPermissions,
): boolean {
  return (
    permissions.can_create_activity && can_user_add_activities(profile_state)
  );
}

export function resolve_calendar_page_subtitle(
  permissions: CalendarActivityPermissions,
): string {
  return Object.values(permissions).some(Boolean)
    ? CALENDAR_PAGE_SUBTITLES.MANAGE
    : CALENDAR_PAGE_SUBTITLES.READ_ONLY;
}

export function should_show_calendar_activity_delete_button(
  editing_activity_source_type: string,
  can_delete_activity: boolean,
): boolean {
  return (
    can_delete_activity &&
    editing_activity_source_type === ACTIVITY_SOURCE_TYPE.MANUAL
  );
}
