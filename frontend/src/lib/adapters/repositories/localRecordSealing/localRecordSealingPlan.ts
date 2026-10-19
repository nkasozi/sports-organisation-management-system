import type { DBCoreIndex, DBCoreTableSchema } from "dexie";

import type { LocalRecordSealingPlan } from "./localRecordSealingTypes";

const STRING_TYPE_NAME = "string";

function list_index_member_paths(index: DBCoreIndex): string[] {
  const key_path: unknown = index.keyPath;
  if (typeof key_path === STRING_TYPE_NAME) return [key_path as string];
  if (!Array.isArray(key_path)) return [];
  return key_path.filter(
    (member_path: unknown): member_path is string =>
      typeof member_path === STRING_TYPE_NAME,
  );
}

export function build_local_record_sealing_plan(
  table_schema: DBCoreTableSchema,
): LocalRecordSealingPlan {
  const member_paths = [table_schema.primaryKey, ...table_schema.indexes]
    .flatMap(list_index_member_paths)
    .filter((member_path: string) => member_path.length > 0);
  return {
    table_name: table_schema.name,
    visible_field_paths: [...new Set(member_paths)].sort(),
  };
}
