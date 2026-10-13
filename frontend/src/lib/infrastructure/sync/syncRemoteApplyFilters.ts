import type { Table } from "dexie";

import { build_sync_outbox_key } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

type GenericTable = Table<Record<string, unknown>, unknown>;

interface VersionedRemoteChange {
  local_id: string;
  server_version: number;
}

export async function find_dirty_local_ids(
  outbox: GenericTable,
  table_name: string,
  local_ids: string[],
): Promise<Set<string>> {
  const entries = await outbox.bulkGet(
    local_ids.map((local_id) => build_sync_outbox_key(table_name, local_id)),
  );
  return new Set(
    local_ids.filter((_local_id, index) => entries[index] !== void 0),
  );
}

export async function find_stale_local_ids(
  versions: GenericTable,
  table_name: string,
  changes: VersionedRemoteChange[],
): Promise<Set<string>> {
  const known_versions = await versions.bulkGet(
    changes.map((change) => build_sync_outbox_key(table_name, change.local_id)),
  );
  return new Set(
    changes
      .filter((change, index) => {
        const known_version = known_versions[index];
        return (
          known_version !== void 0 &&
          Number(known_version.server_version) > change.server_version
        );
      })
      .map((change) => change.local_id),
  );
}
