import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { mask_email_for_logging } from "./lib/log_masking";
import { authorize_super_admin_seed } from "./lib/super_admin_seed_access";
import {
  SuperAdminSeedOutcomeKind,
  upsert_seeded_super_admin,
} from "./lib/super_admin_seed_writer";

const DEFAULT_FIRST_NAME = "Super";
const DEFAULT_LAST_NAME = "Admin";
const AdminSeedAction = { RESTORED: "restored", CREATED: "created" } as const;

type AdminSeedResult =
  | {
      success: true;
      action: typeof AdminSeedAction.RESTORED;
      email: string;
    }
  | {
      success: true;
      action: typeof AdminSeedAction.CREATED;
      email: string;
      id: Id<"system_users">;
    }
  | { success: false; error: string };

export const seed_admin_user = mutation({
  args: {
    email: v.string(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AdminSeedResult> => {
    const normalized_email = args.email.toLowerCase().trim();
    const seed_authorization = await authorize_super_admin_seed(
      ctx,
      normalized_email,
    );
    if (!seed_authorization.success) {
      console.log("[admin_seed] Seed attempt rejected", {
        event: "seed_access_denied",
        masked_target_email: mask_email_for_logging(normalized_email),
      });
      return { success: false, error: seed_authorization.error };
    }
    const first_name = args.first_name ?? DEFAULT_FIRST_NAME;
    const last_name = args.last_name ?? DEFAULT_LAST_NAME;
    const outcome = await upsert_seeded_super_admin(ctx, {
      email: normalized_email,
      first_name,
      last_name,
      display_name: `${first_name} ${last_name}`,
    });
    console.log("[admin_seed] Super admin seeded", {
      event: "seed_admin_user_completed",
      outcome: outcome.kind,
      user_id: outcome.user_id,
    });
    return outcome.kind === SuperAdminSeedOutcomeKind.CREATED
      ? {
          success: true,
          action: AdminSeedAction.CREATED,
          email: normalized_email,
          id: outcome.user_id,
        }
      : {
          success: true,
          action: AdminSeedAction.RESTORED,
          email: normalized_email,
        };
  },
});
