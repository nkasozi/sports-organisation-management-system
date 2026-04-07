import { v } from "convex/values";

import { internalMutation } from "./_generated/server";
import { SecurityEventType } from "./lib/security_event_types";

export { SecurityEventType };

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
    const local_id = `security_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const resolved_correlation_id =
      args.correlation_id ??
      `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await ctx.db.insert("audit_logs", {
      local_id,
      synced_at: timestamp,
      version: 1,
      action: args.event_type,
      entity_type: args.entity_type ?? "security",
      entity_id: args.entity_id ?? local_id,
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
      entity_type: args.entity_type,
      user_email: args.user_email,
      organization_id: args.organization_id,
      correlation_id: resolved_correlation_id,
    });

    return { success: true };
  },
});
