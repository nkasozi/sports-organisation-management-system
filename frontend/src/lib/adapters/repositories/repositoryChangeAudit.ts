import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import { emit_entity_changed } from "$lib/infrastructure/events/entityChangeEvents";
import type { EntityChangedPayload } from "$lib/infrastructure/events/EventBusTypes";
import { get_entity_type_for_table } from "$lib/infrastructure/sync/syncTableEntityTypes";

import {
  type RepositoryWriteOrigin,
  RepositoryWriteOriginKind,
} from "./InBrowserRepositoryWriteOrigin";

const UNAUDITED_TABLES: ReadonlySet<string> = new Set([
  "audit_logs",
  "app_settings",
  "calendar_tokens",
]);
const NO_RECORD: Record<string, unknown> = {};
const OBJECT_TAG = "[object Object]";
const ID_FIELD = "id";

function as_record(entity: BaseEntity): Record<string, unknown> {
  return entity as unknown as Record<string, unknown>;
}

function should_audit(
  table_name: string,
  origin: RepositoryWriteOrigin,
): boolean {
  return (
    origin.kind === RepositoryWriteOriginKind.USER &&
    !UNAUDITED_TABLES.has(table_name) &&
    !table_name.startsWith("sync_")
  );
}

export function audit_repository_change(
  command: {
    table_name: string;
    origin: RepositoryWriteOrigin;
    action: EntityChangedPayload["action"];
  },
  before: BaseEntity | false,
  after: BaseEntity | false,
): boolean {
  if (!should_audit(command.table_name, command.origin)) return false;
  const reference = after || before;
  if (!reference) return false;
  return emit_entity_changed({
    entity_type: get_entity_type_for_table(command.table_name),
    entity_id: String(reference.id),
    action: command.action,
    before: before ? as_record(before) : NO_RECORD,
    after: after ? as_record(after) : NO_RECORD,
  });
}

interface RepositoryAuditTarget {
  table_name: string;
  origin: RepositoryWriteOrigin;
  action: EntityChangedPayload["action"];
}

function is_entity(value: unknown): value is BaseEntity {
  return (
    Object.prototype.toString.call(value) === OBJECT_TAG &&
    ID_FIELD in (value as object)
  );
}

export function audit_after_write<
  TResult extends { success: boolean; data?: unknown },
>(
  target: RepositoryAuditTarget,
  before: BaseEntity | false,
  result: TResult,
): TResult {
  if (!result.success) return result;
  audit_repository_change(
    target,
    before,
    is_entity(result.data) ? result.data : false,
  );
  return result;
}
