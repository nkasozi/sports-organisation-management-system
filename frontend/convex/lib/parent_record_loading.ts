import type { QueryCtx } from "../_generated/server";
import {
  build_parent_record_lookup,
  list_candidate_parent_tables,
  type ParentRecordLookup,
} from "./parent_organization_resolution";
import {
  is_parent_scoped_table,
  PARENT_REFERENCE_SPECS,
  type ParentScopedTable,
  type ParentTable,
  read_reference,
} from "./parent_reference_specs";

const MAX_PARENT_LEVELS = 3;
const INDEXED_LOOKUP_BATCH_SIZE = 20;
const LOCAL_ID_INDEX_NAME = "by_local_id";
const LOCAL_ID_FIELD = "local_id";

interface ParentRowLoader {
  load_rows(
    table_name: ParentTable,
    local_ids: string[],
  ): Promise<Array<Record<string, unknown>>>;
}

interface PendingChildren {
  table_name: ParentScopedTable;
  records: Array<Record<string, unknown>>;
}

function collect_parent_requests(
  pending_children: PendingChildren[],
  loaded_ids: Map<string, Set<string>>,
): Map<ParentTable, Set<string>> {
  const requests = new Map<ParentTable, Set<string>>();
  for (const { table_name, records } of pending_children) {
    const parent_id_field = PARENT_REFERENCE_SPECS[table_name].parent_id_field;
    for (const record of records) {
      const parent_local_id = read_reference(record, parent_id_field);
      if (!parent_local_id) continue;
      for (const parent_table of list_candidate_parent_tables(
        table_name,
        record,
      )) {
        if (loaded_ids.get(parent_table)?.has(parent_local_id)) continue;
        const requested_ids = requests.get(parent_table) ?? new Set<string>();
        requested_ids.add(parent_local_id);
        requests.set(parent_table, requested_ids);
      }
    }
  }
  return requests;
}

export async function load_parent_record_lookup(
  loader: ParentRowLoader,
  table_name: ParentScopedTable,
  records: Array<Record<string, unknown>>,
): Promise<ParentRecordLookup> {
  const rows_by_table: Record<string, Array<Record<string, unknown>>> = {};
  const loaded_ids = new Map<string, Set<string>>();
  let pending_children: PendingChildren[] = [{ table_name, records }];
  for (
    let level = 0;
    level < MAX_PARENT_LEVELS && pending_children.length > 0;
    level++
  ) {
    const requests = [...collect_parent_requests(pending_children, loaded_ids)];
    const loaded_levels = await Promise.all(
      requests.map(async ([parent_table, local_ids]) => ({
        parent_table,
        local_ids,
        rows: await loader.load_rows(parent_table, [...local_ids]),
      })),
    );
    pending_children = [];
    for (const { parent_table, local_ids, rows } of loaded_levels) {
      rows_by_table[parent_table] = [
        ...(rows_by_table[parent_table] ?? []),
        ...rows,
      ];
      loaded_ids.set(
        parent_table,
        new Set([...(loaded_ids.get(parent_table) ?? []), ...local_ids]),
      );
      if (is_parent_scoped_table(parent_table) && rows.length > 0)
        pending_children.push({ table_name: parent_table, records: rows });
    }
  }
  return build_parent_record_lookup(rows_by_table);
}

function split_into_batches(
  local_ids: string[],
  batch_size: number,
): string[][] {
  const batches: string[][] = [];
  for (let start = 0; start < local_ids.length; start += batch_size)
    batches.push(local_ids.slice(start, start + batch_size));
  return batches;
}

async function load_rows_by_local_id(
  ctx: { db: QueryCtx["db"] },
  table_name: ParentTable,
  local_ids: string[],
): Promise<Array<Record<string, unknown>>> {
  const indexed_rows = await Promise.all(
    local_ids.map((local_id) =>
      ctx.db
        .query(table_name)
        .withIndex(LOCAL_ID_INDEX_NAME, (query) =>
          query.eq(LOCAL_ID_FIELD, local_id),
        )
        .first(),
    ),
  );
  return indexed_rows.flatMap((row) => (row ? [row] : []));
}

export function create_database_parent_row_loader(ctx: {
  db: QueryCtx["db"];
}): ParentRowLoader {
  return {
    load_rows: async (table_name, local_ids) => {
      const loaded_rows: Array<Record<string, unknown>> = [];
      const unique_local_ids = [...new Set(local_ids)];
      for (const batch of split_into_batches(
        unique_local_ids,
        INDEXED_LOOKUP_BATCH_SIZE,
      ))
        loaded_rows.push(
          ...(await load_rows_by_local_id(ctx, table_name, batch)),
        );
      return loaded_rows;
    },
  };
}
