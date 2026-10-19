import type Dexie from "dexie";

import { local_data_key_holder } from "$lib/infrastructure/localVault/localDataKeyHolder";
import { local_record_tamper_notifier } from "$lib/infrastructure/localVault/localRecordTamperNotifier";

import { create_local_record_sealing_middleware } from "./localRecordSealingMiddleware";

export function register_local_record_sealing(database: Dexie): boolean {
  database.use(
    create_local_record_sealing_middleware({
      read_data_key: () => local_data_key_holder.current(),
      report_unreadable_records: (
        table_name: string,
        record_count: number,
      ): boolean => {
        local_record_tamper_notifier.report(table_name, record_count);
        return true;
      },
    }),
  );
  return true;
}
