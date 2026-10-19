import type { DBCore, DBCoreTable, DBCoreTableSchema, Middleware } from "dexie";

import { build_local_record_sealing_plan } from "./localRecordSealingPlan";
import { wrap_sealed_table } from "./localRecordSealingTable";
import {
  LOCAL_RECORD_SEALING_MIDDLEWARE_LEVEL,
  LOCAL_RECORD_SEALING_MIDDLEWARE_NAME,
  type LocalRecordSealingDependencies,
} from "./localRecordSealingTypes";

function build_sealed_tables(
  down_core: DBCore,
  dependencies: LocalRecordSealingDependencies,
): Map<string, DBCoreTable> {
  return new Map(
    down_core.schema.tables.map(
      (table_schema: DBCoreTableSchema): [string, DBCoreTable] => [
        table_schema.name,
        wrap_sealed_table({
          down_table: down_core.table(table_schema.name),
          plan: build_local_record_sealing_plan(table_schema),
          dependencies,
        }),
      ],
    ),
  );
}

export function create_local_record_sealing_middleware(
  dependencies: LocalRecordSealingDependencies,
): Middleware<DBCore> {
  return {
    stack: "dbcore",
    name: LOCAL_RECORD_SEALING_MIDDLEWARE_NAME,
    level: LOCAL_RECORD_SEALING_MIDDLEWARE_LEVEL,
    create: (down_core: DBCore): Partial<DBCore> => {
      const sealed_tables = build_sealed_tables(down_core, dependencies);
      return {
        ...down_core,
        table: (table_name: string): DBCoreTable =>
          sealed_tables.get(table_name) ?? down_core.table(table_name),
      };
    },
  };
}
