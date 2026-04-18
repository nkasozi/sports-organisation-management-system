import { v } from "convex/values";

import { mutation } from "./_generated/server";

const PLATFORM_WIDE_SCOPE = "*";

function mask_email_for_logging(email: string): string {
  const at_index = email.indexOf("@");
  if (at_index <= 0) return "***";
  const first_char = email[0];
  const domain = email.substring(at_index);
  return `${first_char}***${domain}`;
}

function check_caller_platform_access(organization_id: string): boolean {
  return organization_id === PLATFORM_WIDE_SCOPE;
}

export const seed_admin_user = mutation({
  args: {
    email: v.string(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalized_email = args.email.toLowerCase().trim();

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      console.log("[admin_seed] Seed attempt rejected", {
        event: "seed_auth_required",
        reason: "no_identity",
      });
      return {
        success: false,
        error: "Authentication required to seed admin users",
      };
    }

    const all_users = await ctx.db.query("system_users").collect();
    const is_bootstrap_mode = all_users.length === 0;

    if (is_bootstrap_mode) {
      console.log("[admin_seed] Bootstrap mode activated", {
        event: "bootstrap_seed_initiated",
        masked_email: mask_email_for_logging(identity.email),
      });
    }

    if (!is_bootstrap_mode) {
      const caller_email = identity.email.toLowerCase();
      const caller = all_users.find((u: any) => u.email === caller_email);
      const caller_organization_id =
        caller && typeof caller.organization_id === "string"
          ? caller.organization_id
          : "";
      const has_platform_access = check_caller_platform_access(
        caller_organization_id,
      );
      if (!has_platform_access) {
        console.log("[admin_seed] Non-bootstrap seed rejected", {
          event: "seed_access_denied",
          masked_caller_email: mask_email_for_logging(caller_email),
        });
        return {
          success: false,
          error: "Only super admins can seed admin users",
        };
      }
    }

    const existing_user = await ctx.db
      .query("system_users")
      .withIndex("by_email", (q: any) => q.eq("email", normalized_email))
      .first();

    const now = new Date().toISOString();

    if (existing_user) {
      await ctx.db.patch(existing_user._id, {
        role: "super_admin",
        status: "active",
        updated_at: now,
      });
      return { success: true, action: "restored", email: normalized_email };
    }

    const safe_email_key = normalized_email.replace(/[@.]/g, "_");
    const inserted_id = await ctx.db.insert("system_users", {
      email: normalized_email,
      first_name: args.first_name ?? "Super",
      last_name: args.last_name ?? "Admin",
      role: "super_admin",
      organization_id: "*",
      team_id: "*",
      player_id: "*",
      status: "active",
      local_id: `admin_seed_${safe_email_key}`,
      synced_at: now,
      version: 1,
      created_at: now,
      updated_at: now,
    });

    return {
      success: true,
      action: "created",
      email: normalized_email,
      id: inserted_id,
    };
  },
});
