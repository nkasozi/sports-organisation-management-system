import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import {
  decide_e2e_profile,
  E2E_PROFILES_ENABLED_VALUE,
  E2E_PROFILES_ENVIRONMENT_VARIABLE,
} from "./lib/e2e_profile_policy";
import { upsert_e2e_profile } from "./lib/e2e_profile_writer";
import {
  delete_organization_games,
  delete_organization_world,
} from "./lib/e2e_world_reset";
import { mask_email_for_logging } from "./lib/log_masking";

type E2eProfileResult =
  | { success: true; local_id: string }
  | { success: false; error: string };

export const register_e2e_profile = internalMutation({
  args: {
    email: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    role: v.string(),
    organization_id: v.string(),
    team_id: v.optional(v.string()),
    official_id: v.optional(v.string()),
    player_id: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<E2eProfileResult> => {
    const decision = decide_e2e_profile({
      enabled_flag: process.env[E2E_PROFILES_ENVIRONMENT_VARIABLE],
      email: args.email,
      role: args.role,
    });
    if (!decision.allowed) {
      console.warn("[e2e_profiles] Profile registration refused", {
        event: "e2e_profile_refused",
        masked_email: mask_email_for_logging(args.email),
        reason: decision.reason,
      });
      return { success: false, error: decision.reason };
    }
    const local_id = await upsert_e2e_profile(ctx, {
      ...args,
      email: decision.email,
      role: decision.role,
    });
    console.log("[e2e_profiles] Profile registered", {
      event: "e2e_profile_registered",
      masked_email: mask_email_for_logging(decision.email),
      role: decision.role,
    });
    return { success: true, local_id };
  },
});

const E2E_READABLE_TABLES = [
  "sports",
  "organizations",
  "teams",
  "officials",
  "players",
  "competitions",
  "venues",
  "fixtures",
  "fixture_details_setups",
  "fixture_lineups",
  "player_team_memberships",
  "competition_teams",
  "system_users",
  "audit_logs",
] as const;

type E2eReadableTable = (typeof E2E_READABLE_TABLES)[number];

function is_e2e_readable_table(table: string): table is E2eReadableTable {
  return E2E_READABLE_TABLES.some((known_table) => known_table === table);
}

export const list_e2e_records = internalQuery({
  args: { table: v.string(), organization_id: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Array<Record<string, unknown>>> => {
    const is_enabled =
      process.env[E2E_PROFILES_ENVIRONMENT_VARIABLE] ===
      E2E_PROFILES_ENABLED_VALUE;
    if (!is_enabled || !is_e2e_readable_table(args.table)) return [];
    const records: Array<Record<string, unknown>> = await ctx.db
      .query(args.table)
      .collect();
    return records.filter(
      (record) =>
        !args.organization_id ||
        record.organization_id === args.organization_id,
    );
  },
});

export const reset_e2e_world = internalMutation({
  args: { organization_name: v.string(), sport_name: v.string() },
  handler: async (ctx, args) => {
    const is_enabled =
      process.env[E2E_PROFILES_ENVIRONMENT_VARIABLE] ===
      E2E_PROFILES_ENABLED_VALUE;
    if (!is_enabled) return { success: false, deleted_count: 0 };
    let deleted_count = 0;
    const organizations = (
      await ctx.db.query("organizations").collect()
    ).filter((record) => record.name === args.organization_name);
    for (const organization of organizations) {
      deleted_count += await delete_organization_world(
        ctx,
        organization.local_id,
      );
      await ctx.db.delete(organization._id);
      deleted_count += 1;
    }
    const sports = (await ctx.db.query("sports").collect()).filter(
      (record) => record.name === args.sport_name,
    );
    for (const sport of sports) {
      await ctx.db.delete(sport._id);
      deleted_count += 1;
    }
    console.log("[e2e_profiles] E2E world reset", {
      event: "e2e_world_reset",
      deleted_count,
    });
    return { success: true, deleted_count };
  },
});

export const reset_e2e_games = internalMutation({
  args: { organization_name: v.string() },
  handler: async (ctx, args) => {
    const is_enabled =
      process.env[E2E_PROFILES_ENVIRONMENT_VARIABLE] ===
      E2E_PROFILES_ENABLED_VALUE;
    if (!is_enabled) return { success: false, deleted_count: 0 };
    const organization = (await ctx.db.query("organizations").collect()).find(
      (record) => record.name === args.organization_name,
    );
    if (!organization) return { success: true, deleted_count: 0 };
    const deleted_count = await delete_organization_games(
      ctx,
      organization.local_id,
    );
    console.log("[e2e_profiles] E2E games reset", {
      event: "e2e_games_reset",
      deleted_count,
    });
    return { success: true, deleted_count };
  },
});
