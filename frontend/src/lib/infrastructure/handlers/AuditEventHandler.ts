import {
  AUDIT_ACTION,
  type CreateAuditLogInput,
} from "../../core/entities/AuditLog";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { get_repository_container } from "../container";
import {
  type AccessDeniedPayload,
  type EntityCreatedPayload,
  type EntityDeletedPayload,
  type EntityUpdatedPayload,
  EventBus,
  type PageViewedPayload,
} from "../events/EventBus";
import { EVENT_TYPE } from "../events/eventBusConstants";
import {
  ACCESS_DENIED_DISPLAY_NAME_PREFIX,
  AUDIT_EVENT_HANDLER_LOG_EVENT,
  AUDIT_LOG_WRITE_FAILED_MESSAGE,
  AUDIT_PAGE_ENTITY_TYPE,
} from "./auditEventConstants";
import {
  apply_anonymous_user_identity,
  build_access_denied_details,
  build_base_audit_input,
  build_field_changes,
} from "./AuditEventInputBuilders";

async function persist_audit_input(
  audit_input: CreateAuditLogInput,
): AsyncResult<boolean> {
  const result =
    await get_repository_container().audit_log_repository.create(audit_input);
  if (result.success) return create_success_result(true);
  console.error("[AuditEventHandler] Failed to write audit log", {
    event: AUDIT_EVENT_HANDLER_LOG_EVENT.AUDIT_LOG_WRITE_FAILED,
    entity_type: audit_input.entity_type,
    entity_id: audit_input.entity_id,
    action: audit_input.action,
    organization_id: audit_input.organization_id,
    error: result.error,
  });
  return create_failure_result(AUDIT_LOG_WRITE_FAILED_MESSAGE);
}

function handle_entity_created(
  payload: EntityCreatedPayload,
): AsyncResult<boolean> {
  return persist_audit_input(
    build_base_audit_input(
      payload.entity_type,
      payload.entity_id,
      payload.entity_display_name,
      AUDIT_ACTION.CREATE,
      [],
      payload.user_context,
    ),
  );
}

async function handle_entity_updated(
  payload: EntityUpdatedPayload,
): AsyncResult<boolean> {
  if (payload.changed_fields.length === 0) return create_success_result(false);
  const changes = build_field_changes(
    payload.old_entity_data,
    payload.entity_data,
    payload.changed_fields,
  );
  return persist_audit_input(
    build_base_audit_input(
      payload.entity_type,
      payload.entity_id,
      payload.entity_display_name,
      AUDIT_ACTION.UPDATE,
      changes,
      payload.user_context,
    ),
  );
}

function handle_entity_deleted(
  payload: EntityDeletedPayload,
): AsyncResult<boolean> {
  return persist_audit_input(
    build_base_audit_input(
      payload.entity_type,
      payload.entity_id,
      payload.entity_display_name,
      AUDIT_ACTION.DELETE,
      [],
      payload.user_context,
    ),
  );
}

function handle_access_denied(
  payload: AccessDeniedPayload,
): AsyncResult<boolean> {
  const base_input = build_base_audit_input(
    payload.entity_type,
    payload.entity_id,
    `${ACCESS_DENIED_DISPLAY_NAME_PREFIX}${payload.entity_type}`,
    AUDIT_ACTION.ACCESS_DENIED,
    build_access_denied_details(payload),
    payload.user_context,
  );
  return persist_audit_input(
    apply_anonymous_user_identity(base_input, payload.user_context),
  );
}

function handle_page_viewed(payload: PageViewedPayload): AsyncResult<boolean> {
  const base_input = build_base_audit_input(
    AUDIT_PAGE_ENTITY_TYPE,
    payload.page_path,
    payload.page_title,
    AUDIT_ACTION.PAGE_VIEW,
    [],
    payload.user_context,
  );
  return persist_audit_input(
    apply_anonymous_user_identity(base_input, payload.user_context),
  );
}

let is_initialized = false;

export function initialize_audit_event_handlers(): boolean {
  if (is_initialized) return false;
  EventBus.subscribe(EVENT_TYPE.ENTITY_CREATED, handle_entity_created);
  EventBus.subscribe(EVENT_TYPE.ENTITY_UPDATED, handle_entity_updated);
  EventBus.subscribe(EVENT_TYPE.ENTITY_DELETED, handle_entity_deleted);
  EventBus.subscribe(EVENT_TYPE.ACCESS_DENIED, handle_access_denied);
  EventBus.subscribe(EVENT_TYPE.PAGE_VIEWED, handle_page_viewed);
  is_initialized = true;
  return true;
}

export function reset_audit_event_handlers(): void {
  is_initialized = false;
}
