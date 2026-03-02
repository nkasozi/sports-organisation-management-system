import {
  EventBus,
  type EntityCreatedPayload,
  type EntityUpdatedPayload,
  type EntityDeletedPayload,
  type AccessDeniedPayload,
} from "../events/EventBus";
import { get_repository_container } from "../container";
import type {
  CreateAuditLogInput,
  FieldChange,
} from "../../core/entities/AuditLog";

function build_field_changes(
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

async function handle_entity_created(
  payload: EntityCreatedPayload,
): Promise<void> {
  const container = get_repository_container();
  const audit_log_repository = container.audit_log_repository;

  const audit_input: CreateAuditLogInput = {
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    entity_display_name: payload.entity_display_name,
    action: "create",
    changes: [],
    user_id: payload.user_context?.user_id ?? "system",
    user_email: payload.user_context?.user_email ?? "system@sportsorg.local",
    user_display_name: payload.user_context?.user_display_name ?? "System",
    organization_id: payload.user_context?.organization_id ?? "*",
    ip_address: "127.0.0.1",
    user_agent: "SportsOrgApp/1.0",
  };

  await audit_log_repository.create(audit_input);
}

async function handle_entity_updated(
  payload: EntityUpdatedPayload,
): Promise<void> {
  if (payload.changed_fields.length === 0) return;

  const container = get_repository_container();
  const audit_log_repository = container.audit_log_repository;

  const changes = build_field_changes(
    payload.old_entity_data,
    payload.entity_data,
    payload.changed_fields,
  );

  const audit_input: CreateAuditLogInput = {
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    entity_display_name: payload.entity_display_name,
    action: "update",
    changes,
    user_id: payload.user_context?.user_id ?? "system",
    user_email: payload.user_context?.user_email ?? "system@sportsorg.local",
    user_display_name: payload.user_context?.user_display_name ?? "System",
    organization_id: payload.user_context?.organization_id ?? "*",
    ip_address: "127.0.0.1",
    user_agent: "SportsOrgApp/1.0",
  };

  await audit_log_repository.create(audit_input);
}

async function handle_entity_deleted(
  payload: EntityDeletedPayload,
): Promise<void> {
  const container = get_repository_container();
  const audit_log_repository = container.audit_log_repository;

  const audit_input: CreateAuditLogInput = {
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    entity_display_name: payload.entity_display_name,
    action: "delete",
    changes: [],
    user_id: payload.user_context?.user_id ?? "system",
    user_email: payload.user_context?.user_email ?? "system@sportsorg.local",
    user_display_name: payload.user_context?.user_display_name ?? "System",
    organization_id: payload.user_context?.organization_id ?? "*",
    ip_address: "127.0.0.1",
    user_agent: "SportsOrgApp/1.0",
  };

  await audit_log_repository.create(audit_input);
}

async function handle_access_denied(
  payload: AccessDeniedPayload,
): Promise<void> {
  const container = get_repository_container();
  const audit_log_repository = container.audit_log_repository;

  const denial_details = [
    {
      field_name: "attempted_action",
      old_value: "",
      new_value: payload.attempted_action,
    },
    {
      field_name: "data_category",
      old_value: "",
      new_value: payload.data_category,
    },
    {
      field_name: "denial_reason",
      old_value: "",
      new_value: payload.denial_reason,
    },
    {
      field_name: "role",
      old_value: "",
      new_value: payload.user_context?.role ?? "unknown",
    },
  ];

  if (payload.context) {
    denial_details.push({
      field_name: "context",
      old_value: "",
      new_value: payload.context,
    });
  }

  const audit_input: CreateAuditLogInput = {
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    entity_display_name: `Access Denied: ${payload.entity_type}`,
    action: "access_denied",
    changes: denial_details,
    user_id: payload.user_context?.user_id ?? "anonymous",
    user_email: payload.user_context?.user_email ?? "anonymous@unknown",
    user_display_name: payload.user_context?.user_display_name ?? "Anonymous",
    organization_id: payload.user_context?.organization_id ?? "*",
    ip_address: "127.0.0.1",
    user_agent: "SportsOrgApp/1.0",
  };

  await audit_log_repository.create(audit_input);
}

let is_initialized = false;

export function initialize_audit_event_handlers(): void {
  if (is_initialized) return;

  EventBus.subscribe<EntityCreatedPayload>(
    "entity_created",
    handle_entity_created,
  );
  EventBus.subscribe<EntityUpdatedPayload>(
    "entity_updated",
    handle_entity_updated,
  );
  EventBus.subscribe<EntityDeletedPayload>(
    "entity_deleted",
    handle_entity_deleted,
  );
  EventBus.subscribe<AccessDeniedPayload>(
    "access_denied",
    handle_access_denied,
  );

  is_initialized = true;
}

export function reset_audit_event_handlers(): void {
  is_initialized = false;
}
