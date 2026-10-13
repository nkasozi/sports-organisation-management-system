import { build_sync_outbox_key } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import {
  type RemoteApplyDependencies,
  run_remote_apply_transaction,
} from "./syncRemoteApply";

const TABLE_NAME_INDEX = "table_name";

interface RemoveAbsentRecordsCommand {
  server_local_ids: Set<string>;
  final_cursor: number;
}

export async function remove_records_absent_on_server(
  dependencies: RemoteApplyDependencies & { table_name: string },
  command: RemoveAbsentRecordsCommand,
): Promise<number> {
  const table_name = dependencies.table_name;
  return run_remote_apply_transaction(
    dependencies,
    table_name,
    async (tables) => {
      const local_ids = (await tables.data.toCollection().primaryKeys()).map(
        String,
      );
      const outbox_entries = await tables.outbox
        .where(TABLE_NAME_INDEX)
        .equals(table_name)
        .toArray();
      const protected_ids = new Set(
        outbox_entries.map((entry) => String(entry.local_id)),
      );
      const absent_ids = local_ids.filter(
        (local_id) =>
          !command.server_local_ids.has(local_id) &&
          !protected_ids.has(local_id),
      );
      await tables.data.bulkDelete(absent_ids);
      await tables.versions.bulkDelete(
        absent_ids.map((local_id) =>
          build_sync_outbox_key(table_name, local_id),
        ),
      );
      await tables.cursors.put({
        table_name,
        after_sequence: command.final_cursor,
      });
      return absent_ids.length;
    },
  );
}
