import type {
  DBCore,
  DBCoreMutateRequest,
  DBCoreMutateResponse,
  DBCoreTable,
  DBCoreTransaction,
  Middleware,
} from "dexie";

import type { ChangeTrackingGate } from "./syncChangeTrackingGate";
import {
  build_pending_outbox_entry,
  read_existing_entry,
  read_known_server_version,
} from "./syncOutboxEntryBuilder";
import {
  resolve_written_keys,
  type WrittenKeys,
  WrittenKeysKind,
} from "./syncOutboxKeyResolution";
import {
  build_sync_outbox_key,
  SYNC_OUTBOX_TABLE_NAME,
  SYNC_RECORD_VERSIONS_TABLE_NAME,
  type SyncOutboxOperationValue,
} from "./syncOutboxTypes";

const SYNC_OUTBOX_MIDDLEWARE_NAME = "SyncOutboxMiddleware";
const READ_WRITE_MODE = "readwrite";

interface SyncOutboxMiddlewareDependencies {
  tracked_table_names: readonly string[];
  gate: ChangeTrackingGate;
  generate_change_token(): string;
  now_iso(): string;
  on_local_changes_recorded(table_name: string, change_count: number): boolean;
}

interface RecordOutboxEntriesCommand {
  down_core: DBCore;
  trans: DBCoreTransaction;
  table_name: string;
  local_ids: string[];
  operation: SyncOutboxOperationValue;
}

export function include_sync_bookkeeping_stores(
  stores: string[],
  mode: string,
  tracked_tables: Set<string>,
): string[] {
  if (mode !== READ_WRITE_MODE) return stores;
  if (!stores.some((store_name) => tracked_tables.has(store_name)))
    return stores;
  const bookkeeping_stores = [
    SYNC_OUTBOX_TABLE_NAME,
    SYNC_RECORD_VERSIONS_TABLE_NAME,
  ].filter((store_name) => !stores.includes(store_name));
  return [...stores, ...bookkeeping_stores];
}

function record_outbox_entries(
  command: RecordOutboxEntriesCommand,
  dependencies: SyncOutboxMiddlewareDependencies,
): Promise<number> {
  const outbox_table = command.down_core.table(SYNC_OUTBOX_TABLE_NAME);
  const versions_table = command.down_core.table(
    SYNC_RECORD_VERSIONS_TABLE_NAME,
  );
  const keys = command.local_ids.map((local_id) =>
    build_sync_outbox_key(command.table_name, local_id),
  );
  const read = { trans: command.trans, keys };
  return outbox_table.getMany(read).then((existing_entries) =>
    versions_table.getMany(read).then((known_versions) => {
      const entries = command.local_ids.map((local_id, index) =>
        build_pending_outbox_entry({
          table_name: command.table_name,
          local_id,
          operation: command.operation,
          existing_entry: read_existing_entry(existing_entries[index]),
          known_server_version: read_known_server_version(
            known_versions[index],
          ),
          change_token: dependencies.generate_change_token(),
          enqueued_at: dependencies.now_iso(),
        }),
      );
      return outbox_table
        .mutate({ type: "put", trans: command.trans, values: entries })
        .then(() => entries.length);
    }),
  );
}

function record_successful_writes(
  down_core: DBCore,
  down_table: DBCoreTable,
  request: DBCoreMutateRequest,
  written_keys: WrittenKeys,
  dependencies: SyncOutboxMiddlewareDependencies,
): Promise<DBCoreMutateResponse> {
  return down_table.mutate(request).then((response) => {
    if (written_keys.kind !== WrittenKeysKind.TRACKED) return response;
    const local_ids = written_keys.select_successful_keys(response);
    if (local_ids.length === 0) return response;
    return record_outbox_entries(
      {
        down_core,
        trans: request.trans,
        table_name: down_table.name,
        local_ids,
        operation: written_keys.operation,
      },
      dependencies,
    ).then((recorded_count) => {
      dependencies.on_local_changes_recorded(down_table.name, recorded_count);
      return response;
    });
  });
}

function mutate_with_outbox(
  down_core: DBCore,
  down_table: DBCoreTable,
  request: DBCoreMutateRequest,
  dependencies: SyncOutboxMiddlewareDependencies,
): Promise<DBCoreMutateResponse> {
  return resolve_written_keys(down_table, request, (written_keys) =>
    record_successful_writes(
      down_core,
      down_table,
      request,
      written_keys,
      dependencies,
    ),
  );
}

function wrap_tracked_table(
  down_core: DBCore,
  table_name: string,
  dependencies: SyncOutboxMiddlewareDependencies,
): DBCoreTable {
  const down_table = down_core.table(table_name);
  return {
    ...down_table,
    mutate: (request: DBCoreMutateRequest): Promise<DBCoreMutateResponse> =>
      dependencies.gate.should_track_write(request.trans)
        ? mutate_with_outbox(down_core, down_table, request, dependencies)
        : down_table.mutate(request),
  };
}

export function create_sync_outbox_middleware(
  dependencies: SyncOutboxMiddlewareDependencies,
): Middleware<DBCore> {
  const tracked_tables = new Set<string>(dependencies.tracked_table_names);
  return {
    stack: "dbcore",
    name: SYNC_OUTBOX_MIDDLEWARE_NAME,
    create: (down_core: DBCore): Partial<DBCore> => ({
      ...down_core,
      transaction: (stores, mode, options): DBCoreTransaction =>
        down_core.transaction(
          include_sync_bookkeeping_stores(stores, mode, tracked_tables),
          mode,
          options,
        ),
      table: (table_name: string): DBCoreTable =>
        tracked_tables.has(table_name)
          ? wrap_tracked_table(down_core, table_name, dependencies)
          : down_core.table(table_name),
    }),
  };
}
