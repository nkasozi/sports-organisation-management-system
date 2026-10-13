import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { to_auditable_entity_id } from "./audit_entity_masking";

const IMMEDIATE_DELAY_MILLISECONDS = 0;

export interface SecurityAuditEntry {
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_email: string;
  organization_id: string;
  details: string;
}

export async function schedule_security_audit(
  ctx: MutationCtx,
  entry: SecurityAuditEntry,
): Promise<boolean> {
  const auditable_entry: SecurityAuditEntry = {
    ...entry,
    entity_id: to_auditable_entity_id(entry.entity_type, entry.entity_id),
  };
  await ctx.scheduler.runAfter(
    IMMEDIATE_DELAY_MILLISECONDS,
    internal.security_audit.log_security_event,
    auditable_entry,
  );
  console.warn("[SecurityAudit] Blocked operation recorded", {
    event: auditable_entry.event_type,
    entity_type: auditable_entry.entity_type,
    entity_id: auditable_entry.entity_id,
    organization_id: auditable_entry.organization_id,
  });
  return true;
}
