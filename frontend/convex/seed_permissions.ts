import { mutation } from "./_generated/server";
import { reseed_permissions } from "./seed_permissions_runtime";

export const seed_permissions = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await reseed_permissions(ctx);
    return { success: true, ...result };
  },
});
