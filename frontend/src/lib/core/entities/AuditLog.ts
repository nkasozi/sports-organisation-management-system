import type { FieldChange } from "$convex/shared_audit_types";

import type {
  EmailAddress,
  EntityId,
  EntityScope,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export const AUDIT_ACTION = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  ACCESS_DENIED: "access_denied",
  PAGE_VIEW: "page_view",
  SYNC_CONFLICT_DETECTED: "sync_conflict_detected",
  SYNC_CONFLICT_RESOLVED: "sync_conflict_resolved",
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

export type { FieldChange };

export interface AuditLog extends BaseEntity {
  entity_type: string;
  entity_id: EntityId;
  entity_display_name: Name;
  action: AuditAction;
  user_id: EntityId;
  user_email: EmailAddress;
  user_display_name: Name;
  organization_id: EntityScope;
  changes: FieldChange[];
  timestamp: IsoDateTimeString;
  ip_address: string;
  user_agent: string;
}

export interface CreateAuditLogInput extends Omit<
  ScalarInput<AuditLog>,
  "id" | "created_at" | "updated_at" | "timestamp" | "ip_address" | "user_agent"
> {
  ip_address?: string;
  user_agent?: string;
}

export function compute_field_changes<T extends Record<string, unknown>>(
  old_entity: T,
  new_entity: T,
  fields_to_track: Array<Extract<keyof T, string>>,
): Array<FieldChange<Extract<keyof T, string>>> {
  const changes: Array<FieldChange<Extract<keyof T, string>>> = [];

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

const OBJECT_VALUE_TYPE = "object";
const EMPTY_AUDIT_VALUE = "";

const AUDIT_EMPTY_VALUE_TAGS = new Set(["[object Null]", "[object Undefined]"]);

function is_empty_audit_value(value: unknown): boolean {
  return AUDIT_EMPTY_VALUE_TAGS.has(Object.prototype.toString.call(value));
}

function serialize_value_for_audit(value: unknown): string {
  if (is_empty_audit_value(value)) {
    return EMPTY_AUDIT_VALUE;
  }

  if (typeof value === OBJECT_VALUE_TYPE) {
    return JSON.stringify(value);
  }

  return String(value);
}
