import {
  describe_field_errors,
  find_record_field_errors,
} from "$convex/shared_field_rules";

import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";

const INVALID_FIELDS_EVENT = "repository_write_rejected_invalid_fields";

export function check_entity_field_rules(
  table_name: string,
  entity: object,
  is_checked: boolean,
): Result<true> {
  if (!is_checked) return create_success_result(true);
  const errors = find_record_field_errors(
    entity as Record<string, unknown>,
    Date.now(),
  );
  if (Object.keys(errors).length === 0) return create_success_result(true);
  console.warn("[Repository] Save refused: some fields are not valid", {
    event: INVALID_FIELDS_EVENT,
    table: table_name,
    fields: Object.keys(errors),
  });
  return create_failure_result(describe_field_errors(errors));
}
