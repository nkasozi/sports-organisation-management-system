import type { MutationCtx } from "../_generated/server";
import { query_table_dynamically, type StoredRow } from "./dynamic_table_query";
import type { Option } from "./option";
import {
  has_refresh_targets,
  type OwnershipRefreshTargets,
  resolve_ownership_refresh_targets,
} from "./ownership_refresh_targets";
import { touch_owned_row, touch_projected_row } from "./ownership_touch";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { read_string_or } from "./value_guards";

const ENDED_MEMBERSHIP_STATUSES = new Set(["inactive", "ended"]);
const EMPTY_VALUE = "";
const OWNERSHIP_REFRESHED_EVENT = "ownership_dependents_refreshed";

type HolderType = "player" | "team_staff" | "official";

const HOLDER_TABLES: Readonly<Record<HolderType, readonly AllowedSyncTable[]>> =
  {
    player: ["identifications"],
    team_staff: ["identifications", "qualifications"],
    official: ["identifications", "qualifications"],
  };

async function load_rows_by_index(
  ctx: MutationCtx,
  query: { table_name: string; index_name: string; field_name: string },
  values: Iterable<string>,
): Promise<StoredRow[]> {
  const rows: StoredRow[] = [];
  for (const value of values)
    rows.push(
      ...(await query_table_dynamically(ctx, query.table_name)
        .withIndex(query.index_name, (range) =>
          range.eq(query.field_name, value),
        )
        .collect()),
    );
  return rows;
}

async function load_holder_rows(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  holder_type: HolderType,
  holder_ids: ReadonlySet<string>,
): Promise<StoredRow[]> {
  const rows: StoredRow[] = [];
  for (const holder_id of holder_ids)
    rows.push(
      ...(await query_table_dynamically(ctx, table_name)
        .withIndex("by_holder", (range) =>
          range.eq("holder_type", holder_type).eq("holder_id", holder_id),
        )
        .collect()),
    );
  return rows;
}

async function touch_holder(
  ctx: MutationCtx,
  holder: { table_name: AllowedSyncTable; holder_type: HolderType },
  holder_ids: ReadonlySet<string>,
): Promise<number> {
  const holder_rows = await load_rows_by_index(
    ctx,
    {
      table_name: holder.table_name,
      index_name: "by_local_id",
      field_name: "local_id",
    },
    holder_ids,
  );
  for (const row of holder_rows)
    await touch_projected_row(ctx, holder.table_name, row);
  let touched = holder_rows.length;
  for (const owned_table of HOLDER_TABLES[holder.holder_type])
    for (const row of await load_holder_rows(
      ctx,
      owned_table,
      holder.holder_type,
      holder_ids,
    )) {
      await touch_owned_row(ctx, owned_table, row);
      touched += 1;
    }
  return touched;
}

async function expand_team_targets(
  ctx: MutationCtx,
  targets: OwnershipRefreshTargets,
): Promise<{
  player_ids: ReadonlySet<string>;
  team_staff_ids: ReadonlySet<string>;
}> {
  const memberships = await load_rows_by_index(
    ctx,
    {
      table_name: "player_team_memberships",
      index_name: "by_team",
      field_name: "team_id",
    },
    targets.team_ids,
  );
  const staff = await load_rows_by_index(
    ctx,
    { table_name: "team_staff", index_name: "by_team", field_name: "team_id" },
    targets.team_ids,
  );
  const active_player_ids = memberships
    .filter(
      (row) =>
        !ENDED_MEMBERSHIP_STATUSES.has(read_string_or(row.status, EMPTY_VALUE)),
    )
    .map((row) => read_string_or(row.player_id, EMPTY_VALUE));
  return {
    player_ids: new Set([...targets.player_ids, ...active_player_ids]),
    team_staff_ids: new Set(
      staff.map((row) => read_string_or(row.local_id, EMPTY_VALUE)),
    ),
  };
}

export async function refresh_ownership_dependents(
  ctx: MutationCtx,
  command: {
    table_name: string;
    previous_record: Option<Record<string, unknown>>;
    next_record: Option<Record<string, unknown>>;
  },
): Promise<number> {
  const targets = resolve_ownership_refresh_targets(command);
  if (!has_refresh_targets(targets)) return 0;
  const expanded = await expand_team_targets(ctx, targets);
  const touched_counts = [
    await touch_holder(
      ctx,
      { table_name: "players", holder_type: "player" },
      expanded.player_ids,
    ),
    await touch_holder(
      ctx,
      { table_name: "team_staff", holder_type: "team_staff" },
      expanded.team_staff_ids,
    ),
    await touch_holder(
      ctx,
      { table_name: "officials", holder_type: "official" },
      targets.official_ids,
    ),
  ];
  const touched_count = touched_counts.reduce(
    (total, count) => total + count,
    0,
  );
  console.log("[OwnershipRefresh] Ownership dependents re-sent", {
    event: OWNERSHIP_REFRESHED_EVENT,
    table_name: command.table_name,
    touched_count,
  });
  return touched_count;
}
