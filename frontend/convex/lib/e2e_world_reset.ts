import type { TableNames } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { is_string } from "./value_guards";

const ORGANIZATION_SCOPED_TABLES: TableNames[] = [
  "user_profiles",
  "organization_settings",
  "competitions",
  "teams",
  "live_game_logs",
  "game_event_logs",
  "player_team_transfer_histories",
  "official_performance_ratings",
  "players",
  "officials",
  "fixtures",
  "calendar_tokens",
  "competition_formats",
  "player_team_memberships",
  "fixture_details_setups",
  "fixture_lineups",
  "activities",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "venues",
  "player_positions",
  "activity_categories",
  "audit_logs",
  "system_users",
  "identification_types",
  "game_event_types",
  "genders",
];

const PARENT_SCOPED_TABLES: TableNames[] = [
  "competition_stages",
  "competition_teams",
  "official_associated_teams",
  "player_profiles",
  "team_profiles",
  "profile_links",
  "jersey_colors",
  "identifications",
  "qualifications",
];

const PARENT_REFERENCE_PATTERN = /_id$/;
const PARENT_PASSES = 2;

type StoredRecord = Record<string, unknown> & { _id: never; local_id?: string };

async function delete_matching(
  ctx: MutationCtx,
  table: TableNames,
  matches: (record: StoredRecord) => boolean,
  deleted_ids: Set<string>,
): Promise<number> {
  const records = (await ctx.db
    .query(table)
    .collect()) as unknown as StoredRecord[];
  const doomed = records.filter(matches);
  for (const record of doomed) {
    if (record.local_id) deleted_ids.add(record.local_id);
    await ctx.db.delete(record._id);
  }
  return doomed.length;
}

function references_deleted_parent(
  record: StoredRecord,
  deleted_ids: Set<string>,
): boolean {
  return Object.entries(record).some(
    ([field, value]) =>
      PARENT_REFERENCE_PATTERN.test(field) &&
      is_string(value) &&
      deleted_ids.has(value),
  );
}

export async function delete_organization_world(
  ctx: MutationCtx,
  organization_id: string,
): Promise<number> {
  const deleted_ids = new Set<string>([organization_id]);
  let deleted_count = 0;
  for (const table of ORGANIZATION_SCOPED_TABLES)
    deleted_count += await delete_matching(
      ctx,
      table,
      (record) => record.organization_id === organization_id,
      deleted_ids,
    );
  for (let pass = 0; pass < PARENT_PASSES; pass += 1)
    for (const table of PARENT_SCOPED_TABLES)
      deleted_count += await delete_matching(
        ctx,
        table,
        (record) => references_deleted_parent(record, deleted_ids),
        deleted_ids,
      );
  return deleted_count;
}

const GAME_TABLES: TableNames[] = [
  "fixtures",
  "fixture_details_setups",
  "fixture_lineups",
  "live_game_logs",
  "game_event_logs",
  "official_performance_ratings",
];

export async function delete_organization_games(
  ctx: MutationCtx,
  organization_id: string,
): Promise<number> {
  const deleted_ids = new Set<string>();
  let deleted_count = 0;
  for (const table of GAME_TABLES)
    deleted_count += await delete_matching(
      ctx,
      table,
      (record) => record.organization_id === organization_id,
      deleted_ids,
    );
  return deleted_count;
}
