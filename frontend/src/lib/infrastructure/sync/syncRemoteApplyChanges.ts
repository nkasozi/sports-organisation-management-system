import {
  build_live_version_row,
  build_tombstone_version_row,
  IncomingVersionRule,
  type IncomingVersionRuleValue,
} from "./syncRecordVersionRows";
import type {
  GenericTable,
  RemoteDeletion,
  RemoteRecordChange,
} from "./syncRemoteApply";
import {
  find_dirty_local_ids,
  find_stale_local_ids,
} from "./syncRemoteApplyFilters";

interface RemoteChangeSet {
  table_name: string;
  records: RemoteRecordChange[];
  deletions: RemoteDeletion[];
}

interface ApplicableChanges {
  dirty: Set<string>;
  records: RemoteRecordChange[];
  deletions: RemoteDeletion[];
}

export async function select_applicable_changes(
  tables: { outbox: GenericTable; versions: GenericTable },
  page: RemoteChangeSet,
  rule: IncomingVersionRuleValue = IncomingVersionRule.CHANGE_FEED,
): Promise<ApplicableChanges> {
  const changes = [...page.records, ...page.deletions];
  const dirty = await find_dirty_local_ids(
    tables.outbox,
    page.table_name,
    changes.map((change) => change.local_id),
  );
  const stale = await find_stale_local_ids(
    tables.versions,
    page.table_name,
    changes,
    rule,
  );
  const is_applicable = (local_id: string): boolean =>
    !dirty.has(local_id) && !stale.has(local_id);
  return {
    dirty,
    records: page.records.filter((record) => is_applicable(record.local_id)),
    deletions: page.deletions.filter((deletion) =>
      is_applicable(deletion.local_id),
    ),
  };
}

export async function write_applicable_changes(
  tables: { data: GenericTable; versions: GenericTable },
  table_name: string,
  changes: Pick<ApplicableChanges, "records" | "deletions">,
): Promise<number> {
  await tables.data.bulkPut(changes.records.map((record) => record.local_data));
  await tables.versions.bulkPut(
    changes.records.map((record) =>
      build_live_version_row(
        table_name,
        record.local_id,
        record.server_version,
      ),
    ),
  );
  await tables.data.bulkDelete(
    changes.deletions.map((deletion) => deletion.local_id),
  );
  await tables.versions.bulkPut(
    changes.deletions.map((deletion) =>
      build_tombstone_version_row(
        table_name,
        deletion.local_id,
        deletion.server_version,
      ),
    ),
  );
  return changes.records.length + changes.deletions.length;
}
