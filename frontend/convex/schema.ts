import { defineSchema } from "convex/server";

import { schema_competition_tables } from "./schema_competition_tables";
import { schema_game_and_admin_tables } from "./schema_game_and_admin_tables";
import { schema_match_tables } from "./schema_match_tables";
import { schema_profile_and_format_tables } from "./schema_profile_and_format_tables";
import { schema_relation_tables } from "./schema_relation_tables";
import { schema_staff_and_location_tables } from "./schema_staff_and_location_tables";
import { schema_support_tables } from "./schema_support_tables";

export default defineSchema({
  ...schema_competition_tables,
  ...schema_match_tables,
  ...schema_staff_and_location_tables,
  ...schema_profile_and_format_tables,
  ...schema_relation_tables,
  ...schema_support_tables,
  ...schema_game_and_admin_tables,
});
