import type { SystemUserRecord } from "./auth_middleware";
import { type Option, OptionStatus } from "./option";
import { is_non_empty_string } from "./value_guards";

export const CREATED_BY_USER_ID_FIELD_NAME = "created_by_user_id";

const CREATOR_STAMPED_TABLES = new Set<string>(["players"]);

interface CreatorStampCommand {
  table_name: string;
  caller: SystemUserRecord;
  record_data: Record<string, unknown>;
  existing_record: Option<Record<string, unknown>>;
}

function resolve_caller_user_id(caller: SystemUserRecord): string {
  return is_non_empty_string(caller.local_id)
    ? caller.local_id
    : String(caller._id);
}

function omit_creator_field(
  record: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([field_name]) => field_name !== CREATED_BY_USER_ID_FIELD_NAME,
    ),
  );
}

function preserve_existing_creator(
  record_data: Record<string, unknown>,
  existing_record: Record<string, unknown>,
): Record<string, unknown> {
  const existing_creator = existing_record[CREATED_BY_USER_ID_FIELD_NAME];
  return is_non_empty_string(existing_creator)
    ? { ...record_data, [CREATED_BY_USER_ID_FIELD_NAME]: existing_creator }
    : record_data;
}

export function stamp_record_creator(
  command: CreatorStampCommand,
): Record<string, unknown> {
  if (!CREATOR_STAMPED_TABLES.has(command.table_name))
    return command.record_data;
  const record_data = omit_creator_field(command.record_data);
  switch (command.existing_record.status) {
    case OptionStatus.NONE:
      return {
        ...record_data,
        [CREATED_BY_USER_ID_FIELD_NAME]: resolve_caller_user_id(command.caller),
      };
    case OptionStatus.SOME:
      return preserve_existing_creator(
        record_data,
        command.existing_record.value,
      );
  }
}
