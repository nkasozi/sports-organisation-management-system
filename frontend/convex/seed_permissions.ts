import { internalMutation } from "./_generated/server";
import { reseed_permissions } from "./seed_permissions_runtime";

export const seed_permissions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const result = await reseed_permissions(ctx);
    return { success: true, ...result };
  },
});
