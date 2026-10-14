import type { SystemUserRecord } from "./auth_middleware";
import { cap_calendar_token_expiry } from "./calendar_token_lifetime";
import type { Option } from "./option";
import { stamp_record_creator } from "./record_creator_stamp";
import { reset_verification_on_identity_change } from "./verification_reset";

interface ServerOwnedFieldsCommand {
  table_name: string;
  caller: SystemUserRecord;
  local_id: string;
  record_data: Record<string, unknown>;
  existing_record: Option<Record<string, unknown>>;
}

export function apply_server_owned_fields(
  command: ServerOwnedFieldsCommand,
): Record<string, unknown> {
  const verified_record = reset_verification_on_identity_change({
    table_name: command.table_name,
    caller_role: command.caller.role,
    local_id: command.local_id,
    record_data: command.record_data,
    existing_record: command.existing_record,
  });
  const stamped_record = stamp_record_creator({
    table_name: command.table_name,
    caller: command.caller,
    record_data: verified_record,
    existing_record: command.existing_record,
  });
  return cap_calendar_token_expiry({
    table_name: command.table_name,
    local_id: command.local_id,
    record_data: stamped_record,
    existing_record: command.existing_record,
    now_milliseconds: Date.now(),
  });
}
