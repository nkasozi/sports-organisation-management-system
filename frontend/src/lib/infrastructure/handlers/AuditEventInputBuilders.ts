import type {
  AuditAction,
  CreateAuditLogInput,
  FieldChange,
} from "../../core/entities/AuditLog";
import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import type {
  AccessDeniedPayload,
  UserContext as EventUserContext,
} from "../events/EventBus";

type AuditEventUserContext = Partial<EventUserContext> & {
  role?: NonNullable<AccessDeniedPayload["user_context"]>["role"];
};

export function build_base_audit_input(
  entity_type: string,
  entity_id: CreateAuditLogInput["entity_id"],
  entity_display_name: CreateAuditLogInput["entity_display_name"],
  action: AuditAction,
  changes: FieldChange[],
  user_context?: AuditEventUserContext,
): CreateAuditLogInput {
  return {
    entity_type,
    entity_id,
    entity_display_name,
    action,
    changes,
    user_id: user_context?.user_id ?? "system",
    user_email: user_context?.user_email ?? "system@sport-sync.local",
    user_display_name: user_context?.user_display_name ?? "System",
    organization_id: user_context?.organization_id ?? WILDCARD_SCOPE,
    ip_address: "127.0.0.1",
    user_agent: "SportSyncApp/1.0",
  };
}

export function build_field_changes(
  old_data: Record<string, unknown>,
  new_data: Record<string, unknown>,
  changed_fields: string[],
): FieldChange[] {
  return changed_fields.map((field) => ({
    field_name: field,
    old_value: String(old_data[field] ?? ""),
    new_value: String(new_data[field] ?? ""),
  }));
}

function create_denial_detail(
  field_name: string,
  new_value: string,
): FieldChange {
  return { field_name, old_value: "", new_value };
}

export function build_access_denied_details(
  payload: AccessDeniedPayload,
): FieldChange[] {
  const denial_details: FieldChange[] = [
    create_denial_detail("attempted_action", payload.attempted_action),
    create_denial_detail("data_category", payload.data_category),
    create_denial_detail("denial_reason", payload.denial_reason),
    create_denial_detail("role", payload.user_context?.role ?? "unknown"),
  ];
  return payload.context
    ? [...denial_details, create_denial_detail("context", payload.context)]
    : denial_details;
}

export function apply_anonymous_user_identity(
  audit_input: CreateAuditLogInput,
  user_context?: AuditEventUserContext,
): CreateAuditLogInput {
  return {
    ...audit_input,
    user_id: user_context?.user_id ?? "anonymous",
    user_email: user_context?.user_email ?? "anonymous@unknown",
    user_display_name: user_context?.user_display_name ?? "Anonymous",
  };
}
