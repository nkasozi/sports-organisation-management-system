import {
  describe_created_record,
  describe_deleted_record,
  describe_updated_record,
} from "../../core/entities/AuditChangeDetails";
import {
  AUDIT_ACTION,
  type CreateAuditLogInput,
  type FieldChange,
} from "../../core/entities/AuditLog";
import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import type {
  EntityChangedPayload,
  UserContext,
} from "../events/EventBusTypes";
import { build_base_audit_input } from "./AuditEventInputBuilders";
import {
  describe_audited_entity,
  with_reference_names,
} from "./auditReferenceNames";

type AuditRecord = Record<string, unknown>;

const ANONYMOUS_USER_CONTEXT = {
  user_id: "anonymous",
  user_email: "anonymous@sport-sync.local",
  user_display_name: "Anonymous user",
  organization_id: WILDCARD_SCOPE,
} as UserContext;

function describe_changes(
  action: EntityChangedPayload["action"],
  before: AuditRecord,
  after: AuditRecord,
): FieldChange[] {
  switch (action) {
    case AUDIT_ACTION.CREATE:
      return describe_created_record(after);
    case AUDIT_ACTION.UPDATE:
      return describe_updated_record(before, after);
    case AUDIT_ACTION.DELETE:
      return describe_deleted_record(before);
  }
}

function pick_subject(payload: EntityChangedPayload): AuditRecord {
  return payload.action === AUDIT_ACTION.DELETE
    ? payload.before
    : payload.after;
}

export async function build_entity_change_audit_input(
  payload: EntityChangedPayload,
): Promise<CreateAuditLogInput | false> {
  const before = await with_reference_names(payload.before);
  const after = await with_reference_names(payload.after);
  const changes = describe_changes(payload.action, before, after);
  if (payload.action === AUDIT_ACTION.UPDATE && changes.length === 0)
    return false;
  const display_name = await describe_audited_entity(
    payload.entity_type,
    pick_subject(payload),
  );
  return build_base_audit_input(
    payload.entity_type,
    payload.entity_id as CreateAuditLogInput["entity_id"],
    display_name as CreateAuditLogInput["entity_display_name"],
    payload.action,
    changes,
    payload.user_context ?? ANONYMOUS_USER_CONTEXT,
  );
}
