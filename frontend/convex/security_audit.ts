import { v } from "convex/values";

import { internalMutation } from "./_generated/server";
import { to_auditable_entity_id } from "./lib/audit_entity_masking";
import { SecurityEventType } from "./lib/security_event_types";

export { SecurityEventType };

const DEFAULT_SECURITY_ENTITY_TYPE = "security";
const SECURITY_LOCAL_ID_PREFIX = "security";
const CORRELATION_ID_PREFIX = "sec";
const RANDOM_SUFFIX_RADIX = 36;
const RANDOM_SUFFIX_START = 2;
const RANDOM_SUFFIX_END = 9;
const INITIAL_AUDIT_VERSION = 1;

function create_unique_identifier(prefix: string): string {
  const random_suffix = Math.random()
    .toString(RANDOM_SUFFIX_RADIX)
    .substring(RANDOM_SUFFIX_START, RANDOM_SUFFIX_END);
  return `${prefix}_${Date.now()}_${random_suffix}`;
}

export const log_security_event = internalMutation({
  args: {
    event_type: v.string(),
    entity_type: v.optional(v.string()),
    entity_id: v.optional(v.string()),
    user_email: v.optional(v.string()),
    organization_id: v.optional(v.string()),
    correlation_id: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const timestamp = new Date().toISOString();
    const local_id = create_unique_identifier(SECURITY_LOCAL_ID_PREFIX);
    const entity_type = args.entity_type ?? DEFAULT_SECURITY_ENTITY_TYPE;
    const resolved_correlation_id =
      args.correlation_id ?? create_unique_identifier(CORRELATION_ID_PREFIX);
    await ctx.db.insert("audit_logs", {
      local_id,
      synced_at: timestamp,
      version: INITIAL_AUDIT_VERSION,
      action: args.event_type,
      entity_type,
      entity_id: to_auditable_entity_id(
        entity_type,
        args.entity_id ?? local_id,
      ),
      entity_display_name: `Security Event: ${args.event_type}`,
      organization_id: args.organization_id,
      user_email: args.user_email,
      correlation_id: resolved_correlation_id,
      timestamp,
      old_values: args.details,
      created_at: timestamp,
      updated_at: timestamp,
    });
    console.log("[SecurityAudit] Event logged", {
      event: args.event_type,
      entity_type,
      organization_id: args.organization_id,
      correlation_id: resolved_correlation_id,
    });
    return { success: true };
  },
});
