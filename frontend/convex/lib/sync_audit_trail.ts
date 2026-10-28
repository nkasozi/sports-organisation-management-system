import type { MutationCtx } from "../_generated/server";
import {
  describe_created_record,
  describe_deleted_record,
  describe_updated_record,
} from "../shared_audit_change_details";
import type { FieldChange } from "../shared_audit_types";
import { strip_convex_fields } from "../sync_record_helpers";
import {
  describe_audited_record,
  with_reference_names,
} from "./audit_reference_names";
import type { SystemUserRecord } from "./auth_middleware";
import {
  type AllowedSyncTable,
  get_entity_type_for_table,
} from "./sync_table_catalog";
import { is_string } from "./value_guards";

type AuditRecord = Record<string, unknown>;

export const SyncAuditAction = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export type SyncAuditActionValue =
  (typeof SyncAuditAction)[keyof typeof SyncAuditAction];

export interface SyncAuditCommand {
  table_name: AllowedSyncTable;
  caller: SystemUserRecord;
  local_id: string;
  action: SyncAuditActionValue;
  before: AuditRecord;
  after: AuditRecord;
}

const AUDIT_LOGS_TABLE = "audit_logs";
const UNAUDITED_TABLES: ReadonlySet<string> = new Set([
  AUDIT_LOGS_TABLE,
  "app_settings",
  "calendar_tokens",
]);
const SYNC_TABLE_PREFIX = "sync_";
const AUDIT_ENTRY_PREFIX = "audit_srv_";
const AUDIT_ENTRY_VERSION = 1;
const SYNC_AUDIT_WRITTEN_EVENT = "sync_audit_entry_written";
const EMPTY = "";

function should_audit(table_name: string): boolean {
  return (
    !UNAUDITED_TABLES.has(table_name) &&
    !table_name.startsWith(SYNC_TABLE_PREFIX)
  );
}

function describe_changes(
  action: SyncAuditActionValue,
  before: AuditRecord,
  after: AuditRecord,
): FieldChange[] {
  switch (action) {
    case SyncAuditAction.CREATE:
      return describe_created_record(after);
    case SyncAuditAction.UPDATE:
      return describe_updated_record(before, after);
    case SyncAuditAction.DELETE:
      return describe_deleted_record(before);
  }
}

function caller_display_name(caller: SystemUserRecord): string {
  const full_name =
    `${caller.first_name ?? EMPTY} ${caller.last_name ?? EMPTY}`.trim();
  return caller.name || full_name || caller.email;
}

function read_organization_id(
  subject: AuditRecord,
  caller: SystemUserRecord,
): string {
  const record_organization = subject.organization_id;
  return is_string(record_organization) && record_organization
    ? record_organization
    : (caller.organization_id ?? EMPTY);
}

function build_entry_id(local_id: string, timestamp: string): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${AUDIT_ENTRY_PREFIX}${Date.parse(timestamp)}_${local_id}_${suffix}`;
}

interface AuditEntryInput {
  command: SyncAuditCommand;
  subject: AuditRecord;
  changes: FieldChange[];
  entity_display_name: string;
}

function build_audit_entry(input: AuditEntryInput): AuditRecord {
  const { command, subject } = input;
  const timestamp = new Date().toISOString();
  const entry_id = build_entry_id(command.local_id, timestamp);
  return {
    id: entry_id,
    local_id: entry_id,
    synced_at: timestamp,
    version: AUDIT_ENTRY_VERSION,
    action: command.action,
    entity_type: get_entity_type_for_table(command.table_name),
    entity_id: command.local_id,
    entity_display_name: input.entity_display_name,
    organization_id: read_organization_id(subject, command.caller),
    user_id: command.caller.local_id ?? String(command.caller._id),
    user_email: command.caller.email,
    user_display_name: caller_display_name(command.caller),
    changes: input.changes,
    timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function record_sync_audit_entry(
  ctx: MutationCtx,
  command: SyncAuditCommand,
): Promise<boolean> {
  if (!should_audit(command.table_name)) return false;
  const before = strip_convex_fields(command.before);
  const after = strip_convex_fields(command.after);
  const changes = describe_changes(
    command.action,
    await with_reference_names(ctx, before),
    await with_reference_names(ctx, after),
  );
  if (command.action === SyncAuditAction.UPDATE && changes.length === 0)
    return false;
  const subject = command.action === SyncAuditAction.DELETE ? before : after;
  const entry = build_audit_entry({
    command,
    subject,
    changes,
    entity_display_name: await describe_audited_record(
      ctx,
      command.table_name,
      subject,
    ),
  });
  await ctx.db.insert(AUDIT_LOGS_TABLE, entry as never);
  console.log("[SyncAuditTrail] Audit entry written", {
    event: SYNC_AUDIT_WRITTEN_EVENT,
    correlation_id: entry.local_id,
    table_name: command.table_name,
    entity_id: command.local_id,
    action: command.action,
    organization_id: entry.organization_id,
    change_count: changes.length,
  });
  return true;
}
