import type { AuditLog } from "$lib/core/entities/AuditLog";
import {
  get_scope_value,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";

const CREATE_ACTION = "create";
const UPDATE_ACTION = "update";
const DELETE_ACTION = "delete";

type AuditLogProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

export type AuditLogOrganizationFilterState =
  | { status: "unfiltered" }
  | { status: "filtered"; organization_id: string };

export function get_audit_log_organization_filter(
  profile_state: AuditLogProfileState,
): AuditLogOrganizationFilterState {
  if (profile_state.status === "missing") {
    return { status: "unfiltered" };
  }

  const organization_id = get_scope_value(
    profile_state.profile,
    "organization_id",
  );

  return organization_id
    ? { status: "filtered", organization_id }
    : { status: "unfiltered" };
}

export function build_audit_log_filter(command: {
  filter_entity_type: string;
  filter_action: string;
  filter_user: string;
  organization_filter_state: AuditLogOrganizationFilterState;
}): Record<string, string> {
  const filter: Record<string, string> = {};
  if (command.filter_entity_type)
    filter.entity_type = command.filter_entity_type;
  if (command.filter_action) filter.action = command.filter_action;
  if (command.filter_user) filter.user_id = command.filter_user;
  if (command.organization_filter_state.status === "filtered") {
    filter.organization_id = command.organization_filter_state.organization_id;
  }
  return filter;
}

export function format_audit_log_timestamp(timestamp: string): string {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
}

export function get_audit_log_action_badge_class(action: string): string {
  switch (action) {
    case CREATE_ACTION:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case UPDATE_ACTION:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case DELETE_ACTION:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

export function format_audit_log_changes(log: AuditLog): string {
  if (!log.changes || log.changes.length === 0) return "";
  return log.changes
    .map(
      (change) =>
        `${change.field_name}: "${change.old_value}" → "${change.new_value}"`,
    )
    .join(", ");
}

export function compute_audit_log_total_pages(
  total_count: number,
  page_size: number,
): number {
  return Math.ceil(total_count / page_size);
}
