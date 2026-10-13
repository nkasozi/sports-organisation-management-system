import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
} from "./fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
} from "./security_test_fixtures.test_support";

export interface ClearJobResponse {
  success: boolean;
  deleted_count: number;
  job_id: string;
  job_status: string;
  error: string;
}

export function sequenced_teams(
  prefix: string,
  organization_id: string,
  count: number,
): Array<Record<string, unknown>> {
  return Array.from({ length: count }, (_unused, index) => ({
    ...build_team_record(
      `${prefix}_${String(index).padStart(4, "0")}`,
      organization_id,
      1,
    ),
    sync_sequence: index + 1,
  }));
}

function derive_sequence_counters(
  tables: Record<string, Array<Record<string, unknown>>>,
): Array<Record<string, unknown>> {
  return Object.entries(tables).map(([table_name, rows]) => ({
    table_name,
    last_sequence: Math.max(
      0,
      ...rows.map((row) =>
        typeof row.sync_sequence === "number" ? row.sync_sequence : 0,
      ),
    ),
  }));
}

export function create_clear_context(
  email: string,
  tables: Record<string, Array<Record<string, unknown>>>,
): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      sync_change_sequences: derive_sequence_counters(tables),
      ...tables,
    },
  });
}

export async function run_scheduled_clear_continuations(
  context: FakeConvexContext,
  continue_handler: unknown,
): Promise<number> {
  let continuation_count = 0;
  for (;;) {
    const pending = context.scheduled_calls.filter(
      (call) => typeof call.function_arguments.job_id === "string",
    );
    const next_call = pending[continuation_count];
    if (!next_call) return continuation_count;
    continuation_count += 1;
    await invoke_convex_handler(
      continue_handler,
      context,
      next_call.function_arguments,
    );
  }
}

export function read_tombstone_ids(context: FakeConvexContext): string[] {
  return find_table_rows(context, "sync_tombstones").map((row) =>
    String(row.local_id),
  );
}
