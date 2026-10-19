import Dexie from "dexie";

import {
  create_none_option,
  create_some_option,
  type Option,
  option_from_document,
  OptionStatus,
} from "$lib/core/types/Option";
import { create_success_result, type Result } from "$lib/core/types/Result";
import {
  open_local_json,
  seal_local_json,
} from "$lib/infrastructure/localVault/localVaultCipher";

import {
  ASSOCIATED_DATA_SEPARATOR,
  type LocalRecordSealingPlan,
  type OpenedLocalRows,
  SEALED_RECORD_FIELD_NAME,
} from "./localRecordSealingTypes";

const UNDEFINED_TYPE_NAME = "undefined";

type VisibleFieldEntry = [string, unknown];

function list_visible_field_entries(
  plan: LocalRecordSealingPlan,
  source: object,
): VisibleFieldEntry[] {
  return plan.visible_field_paths
    .map(
      (field_path: string): VisibleFieldEntry => [
        field_path,
        Dexie.getByKeyPath(source, field_path) as unknown,
      ],
    )
    .filter(
      ([, field_value]: VisibleFieldEntry) =>
        typeof field_value !== UNDEFINED_TYPE_NAME,
    );
}

function build_associated_data(
  plan: LocalRecordSealingPlan,
  entries: VisibleFieldEntry[],
): Uint8Array {
  return new TextEncoder().encode(
    plan.table_name + ASSOCIATED_DATA_SEPARATOR + JSON.stringify(entries),
  );
}

function build_visible_row(entries: VisibleFieldEntry[]): object {
  const row = {};
  entries.forEach(([field_path, field_value]: VisibleFieldEntry) =>
    Dexie.setByKeyPath(row, field_path, field_value),
  );
  return row;
}

export function seal_local_record(
  plan: LocalRecordSealingPlan,
  data_key: Uint8Array,
  record: object,
): Result<object> {
  const entries = list_visible_field_entries(plan, record);
  const sealed = seal_local_json(
    data_key,
    record,
    build_associated_data(plan, entries),
  );
  if (!sealed.success) return sealed;
  return create_success_result({
    ...build_visible_row(entries),
    [SEALED_RECORD_FIELD_NAME]: sealed.data,
  });
}

function read_sealed_bytes(row: Record<string, unknown>): Option<Uint8Array> {
  const sealed_bytes = row[SEALED_RECORD_FIELD_NAME];
  return sealed_bytes instanceof Uint8Array
    ? create_some_option(sealed_bytes)
    : create_none_option();
}

export function open_local_record(
  plan: LocalRecordSealingPlan,
  data_key: Uint8Array,
  stored_row: unknown,
): Option<unknown> {
  const row = option_from_document(stored_row);
  if (row.status === OptionStatus.NONE) return create_none_option();
  const sealed_bytes = read_sealed_bytes(row.value);
  if (sealed_bytes.status === OptionStatus.NONE) return create_none_option();
  const associated_data = build_associated_data(
    plan,
    list_visible_field_entries(plan, row.value),
  );
  const opened = open_local_json(data_key, sealed_bytes.value, associated_data);
  return opened.success
    ? create_some_option(opened.data)
    : create_none_option();
}

export function open_local_rows(
  plan: LocalRecordSealingPlan,
  data_key: Uint8Array,
  stored_rows: readonly unknown[],
): OpenedLocalRows {
  const values = new Array<unknown>(stored_rows.length);
  let unreadable_count = 0;
  stored_rows.forEach((stored_row: unknown, row_index: number) => {
    if (typeof stored_row === UNDEFINED_TYPE_NAME) return;
    const opened = open_local_record(plan, data_key, stored_row);
    if (opened.status === OptionStatus.SOME) values[row_index] = opened.value;
    else unreadable_count += 1;
  });
  return { values, unreadable_count };
}
