import {
  EventBus,
  type EntityCreatedPayload,
  type EntityUpdatedPayload,
  type EntityDeletedPayload,
  type AccessDeniedPayload,
  type PageViewedPayload,
} from "../events/EventBus";
import { get_repository_container } from "../container";
import type {
  CreateAuditLogInput,
  FieldChange,
  AuditAction,
} from "../../core/entities/AuditLog";

interface UserContext {
  user_id?: string;
  user_email?: string;
  user_display_name?: string;
  organization_id?: string;
  role?: string;
}

function build_base_audit_input(
  entity_type: string,
  entity_id: string,
  entity_display_name: string,
  action: AuditAction,
  changes: FieldChange[],
  user_context?: UserContext,
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
    organization_id: user_context?.organization_id ?? "*",
    ip_address: "127.0.0.1",
    user_agent: "SportSyncApp/1.0",
  };
}

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
  const audit_input = build_base_audit_input(
    payload.entity_type,
    payload.entity_id,
    payload.entity_display_name,
    "create",
    [],
    payload.user_context,
  );
  await container.audit_log_repository.create(audit_input);
}

async function handle_entity_updated(
  payload: EntityUpdatedPayload,
): Promise<void> {
  if (payload.changed_fields.length === 0) return;
  const container = get_repository_container();
  const changes = build_field_changes(
    payload.old_entity_data,
    payload.entity_data,
    payload.changed_fields,
  );
  const audit_input = build_base_audit_input(
    payload.entity_type,
    payload.entity_id,
    payload.entity_display_name,
    "update",
    changes,
    payload.user_context,
  );
  await container.audit_log_repository.create(audit_input);
}

async function handle_entity_deleted(
  payload: EntityDeletedPayload,
): Promise<void> {
  const container = get_repository_container();
  const audit_input = build_base_audit_input(
    payload.entity_type,
    payload.entity_id,
    payload.entity_display_name,
    "delete",
    [],
    payload.user_context,
  );
  await container.audit_log_repository.create(audit_input);
}

async function handle_access_denied(
  payload: AccessDeniedPayload,
): Promise<void> {
  const container = get_repository_container();
  const denial_details: FieldChange[] = [
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
  const audit_input = build_base_audit_input(
    payload.entity_type,
    payload.entity_id,
    `Access Denied: ${payload.entity_type}`,
    "access_denied",
    denial_details,
    payload.user_context,
  );
  audit_input.user_id = payload.user_context?.user_id ?? "anonymous";
  audit_input.user_email =
    payload.user_context?.user_email ?? "anonymous@unknown";
  audit_input.user_display_name =
    payload.user_context?.user_display_name ?? "Anonymous";
  await container.audit_log_repository.create(audit_input);
}

let is_initialized = false;

async function handle_page_viewed(payload: PageViewedPayload): Promise<void> {
  const container = get_repository_container();
  const audit_input = build_base_audit_input(
    "page",
    payload.page_path,
    payload.page_title,
    "page_view",
    [],
    payload.user_context,
  );
  audit_input.user_id = payload.user_context?.user_id ?? "anonymous";
  audit_input.user_email =
    payload.user_context?.user_email ?? "anonymous@unknown";
  audit_input.user_display_name =
    payload.user_context?.user_display_name ?? "Anonymous";
  await container.audit_log_repository.create(audit_input);
}

export function initialize_audit_event_handlers(): boolean {
  if (is_initialized) return false;
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
  EventBus.subscribe<PageViewedPayload>("page_viewed", handle_page_viewed);
  is_initialized = true;
  return true;
}

export function reset_audit_event_handlers(): void {
  is_initialized = false;
}
