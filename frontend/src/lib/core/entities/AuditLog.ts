import type { BaseEntity } from "./BaseEntity";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "sync_conflict_detected"
  | "sync_conflict_resolved";

export interface FieldChange {
  field_name: string;
  old_value: string;
  new_value: string;
}

export interface AuditLog extends BaseEntity {
  entity_type: string;
  entity_id: string;
  entity_display_name: string;
  action: AuditAction;
  user_id: string;
  user_email: string;
  user_display_name: string;
  changes: FieldChange[];
  timestamp: string;
  ip_address: string;
  user_agent: string;
}

export interface CreateAuditLogInput {
  entity_type: string;
  entity_id: string;
  entity_display_name: string;
  action: AuditAction;
  user_id: string;
  user_email: string;
  user_display_name: string;
  changes: FieldChange[];
  ip_address?: string;
  user_agent?: string;
}

export function build_audit_log_summary(audit_log: AuditLog): string {
  const action_past_tense = get_action_past_tense(audit_log.action);
  const changes_summary = build_changes_summary(audit_log.changes);

  if (audit_log.action === "update" && audit_log.changes.length > 0) {
    return `${audit_log.user_display_name} ${action_past_tense} ${audit_log.entity_type} "${audit_log.entity_display_name}": ${changes_summary}`;
  }

  return `${audit_log.user_display_name} ${action_past_tense} ${audit_log.entity_type} "${audit_log.entity_display_name}"`;
}

function get_action_past_tense(action: AuditAction): string {
  switch (action) {
    case "create":
      return "created";
    case "update":
      return "updated";
    case "delete":
      return "deleted";
    case "sync_conflict_detected":
      return "detected sync conflict for";
    case "sync_conflict_resolved":
      return "resolved sync conflict for";
  }
}

function build_changes_summary(changes: FieldChange[]): string {
  if (changes.length === 0) return "";

  return changes
    .map(
      (change) =>
        `${change.field_name}: "${change.old_value}" → "${change.new_value}"`,
    )
    .join(", ");
}

export function compute_field_changes<T extends Record<string, unknown>>(
  old_entity: T,
  new_entity: T,
  fields_to_track: string[],
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const field_name of fields_to_track) {
    const old_value = serialize_value_for_audit(old_entity[field_name]);
    const new_value = serialize_value_for_audit(new_entity[field_name]);

    if (old_value !== new_value) {
      changes.push({
        field_name,
        old_value,
        new_value,
      });
    }
  }

  return changes;
}

function serialize_value_for_audit(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
