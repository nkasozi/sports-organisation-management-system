import { v } from "convex/values";

import { query } from "./_generated/server";
import { require_auth } from "./lib/auth_middleware";
import { read_caller_change_marker } from "./lib/sync_change_markers";
import { validate_table_name } from "./lib/sync_validation";

const NO_CHANGES_SEQUENCE = 0;

export const get_table_change_marker = query({
  args: { table_name: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    const auth_result = await require_auth(ctx);
    if (!table_validation.success || !auth_result.success)
      return {
        table_name: args.table_name,
        latest_sequence: NO_CHANGES_SEQUENCE,
      };
    return {
      table_name: args.table_name,
      latest_sequence: await read_caller_change_marker(
        ctx,
        auth_result.data,
        table_validation.data,
      ),
    };
  },
});
