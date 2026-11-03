import {
  describe_field_errors,
  find_record_field_errors,
} from "../shared_field_rules";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import {
  reject_sync_write,
  type SyncWriteDecision,
  SyncWriteRejection,
} from "./sync_write_decision";
import { validate_record_url_fields } from "./url_validation";

const INVALID_FIELD_EVENT = "sync_write_rejected_invalid_field";

export function find_record_content_rejection(
  incoming_record: Option<Record<string, unknown>>,
): Option<SyncWriteDecision> {
  if (incoming_record.status === OptionStatus.NONE) return create_none_option();
  if (!validate_record_url_fields(incoming_record.value).is_valid)
    return create_some_option(
      reject_sync_write(
        SyncWriteRejection.INVALID_URL,
        SyncWriteRejection.INVALID_URL,
      ),
    );
  const field_errors = find_record_field_errors(
    incoming_record.value,
    Date.now(),
  );
  if (Object.keys(field_errors).length === 0) return create_none_option();
  console.warn("[SyncWrite] Record rejected for invalid field values", {
    event: INVALID_FIELD_EVENT,
    fields: Object.keys(field_errors),
  });
  return create_some_option(
    reject_sync_write(
      SyncWriteRejection.INVALID_FIELD,
      describe_field_errors(field_errors),
    ),
  );
}
