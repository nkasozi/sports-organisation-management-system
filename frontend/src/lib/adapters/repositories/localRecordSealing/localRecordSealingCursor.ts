import type { DBCoreCursor } from "dexie";

import { open_local_rows } from "./localRecordSealer";
import type {
  LocalRecordSealingDependencies,
  LocalRecordSealingPlan,
} from "./localRecordSealingTypes";

interface SealedCursorContext {
  plan: LocalRecordSealingPlan;
  data_key: Uint8Array;
  dependencies: LocalRecordSealingDependencies;
}

interface OpenedCursorPosition {
  raw_value: unknown;
  opened_values: unknown[];
}

function open_cursor_position(
  context: SealedCursorContext,
  raw_value: unknown,
): OpenedCursorPosition {
  const opened = open_local_rows(context.plan, context.data_key, [raw_value]);
  return { raw_value, opened_values: opened.values };
}

function report_skipped_rows(
  context: SealedCursorContext,
  skipped_count: number,
): boolean {
  if (skipped_count === 0) return false;
  return context.dependencies.report_unreadable_records(
    context.plan.table_name,
    skipped_count,
  );
}

export function wrap_sealed_cursor(
  cursor: DBCoreCursor,
  context: SealedCursorContext,
): DBCoreCursor {
  let position = open_cursor_position(context, cursor.value);
  const read_current_position = (): OpenedCursorPosition => {
    const raw_value: unknown = cursor.value;
    if (raw_value !== position.raw_value)
      position = open_cursor_position(context, raw_value);
    return position;
  };
  const start = (on_next: () => void): Promise<unknown> => {
    let skipped_count = 0;
    return cursor
      .start(() => {
        if (0 in read_current_position().opened_values) return on_next();
        skipped_count += 1;
        cursor.continue();
      })
      .finally(() => report_skipped_rows(context, skipped_count));
  };
  return Object.create(cursor, {
    key: { get: (): unknown => cursor.key },
    primaryKey: { get: (): unknown => cursor.primaryKey },
    value: { get: (): unknown => read_current_position().opened_values[0] },
    start: { value: start },
  }) as DBCoreCursor;
}
