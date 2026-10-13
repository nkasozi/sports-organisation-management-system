import {
  build_table_query,
  type FakeTableQuery,
  type StoredDocument,
} from "./fake_convex_query.test_support";
import {
  type FakeIdentity,
  FakeIdentityStatus,
} from "./fake_identity.test_support";

export {
  get_registered_function_visibility,
  invoke_convex_handler,
} from "./convex_handler_invoker.test_support";
export type { StoredDocument } from "./fake_convex_query.test_support";
export {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  type FakeIdentity,
} from "./fake_identity.test_support";

interface ScheduledCall {
  function_reference: unknown;
  function_arguments: Record<string, unknown>;
}

export interface FakeConvexContext {
  db: {
    query(table_name: string): FakeTableQuery;
    get(document_id: string): Promise<unknown>;
    insert(table_name: string, document: Record<string, unknown>): string;
    patch(document_id: string, changes: Record<string, unknown>): boolean;
    delete(document_id: string): boolean;
  };
  auth: { getUserIdentity(): Promise<unknown> };
  scheduler: {
    runAfter(
      delay_milliseconds: number,
      function_reference: unknown,
      function_arguments: Record<string, unknown>,
    ): string;
  };
  tables: Map<string, StoredDocument[]>;
  scheduled_calls: ScheduledCall[];
}

const CONVEX_EMPTY_LOOKUP_RESULT: unknown = null;

function get_table_rows(
  tables: Map<string, StoredDocument[]>,
  table_name: string,
): StoredDocument[] {
  const existing_rows = tables.get(table_name);
  if (existing_rows) return existing_rows;
  const created_rows: StoredDocument[] = [];
  tables.set(table_name, created_rows);
  return created_rows;
}

function find_document_location(
  tables: Map<string, StoredDocument[]>,
  document_id: string,
): { rows: StoredDocument[]; index: number } {
  for (const rows of tables.values()) {
    const index = rows.findIndex((row) => row._id === document_id);
    if (index >= 0) return { rows, index };
  }
  return { rows: [], index: -1 };
}

function seed_tables(
  initial_tables: Record<string, Array<Record<string, unknown>>>,
): Map<string, StoredDocument[]> {
  const tables = new Map<string, StoredDocument[]>();
  for (const [table_name, rows] of Object.entries(initial_tables)) {
    tables.set(
      table_name,
      rows.map((row, row_index) => ({
        _id: `${table_name}_seed_${row_index}`,
        ...row,
      })),
    );
  }
  return tables;
}

function build_fake_database(
  tables: Map<string, StoredDocument[]>,
): FakeConvexContext["db"] {
  let insert_counter = 0;
  return {
    query: (table_name: string): FakeTableQuery =>
      build_table_query(get_table_rows(tables, table_name)),
    get: async (document_id: string): Promise<unknown> => {
      const location = find_document_location(tables, document_id);
      return location.index < 0
        ? CONVEX_EMPTY_LOOKUP_RESULT
        : location.rows[location.index];
    },
    insert: (table_name, document): string => {
      insert_counter += 1;
      const document_id = `${table_name}_inserted_${insert_counter}`;
      get_table_rows(tables, table_name).push({
        ...document,
        _id: document_id,
      });
      return document_id;
    },
    patch: (document_id, changes): boolean => {
      const location = find_document_location(tables, document_id);
      if (location.index < 0) return false;
      Object.assign(location.rows[location.index], changes);
      return true;
    },
    delete: (document_id): boolean => {
      const location = find_document_location(tables, document_id);
      if (location.index < 0) return false;
      location.rows.splice(location.index, 1);
      return true;
    },
  };
}

export function create_fake_convex_context(command: {
  identity: FakeIdentity;
  tables: Record<string, Array<Record<string, unknown>>>;
}): FakeConvexContext {
  const tables = seed_tables(command.tables);
  const scheduled_calls: ScheduledCall[] = [];
  const identity = command.identity;
  return {
    db: build_fake_database(tables),
    auth: {
      getUserIdentity: async (): Promise<unknown> =>
        identity.status === FakeIdentityStatus.AUTHENTICATED
          ? { subject: identity.subject, email: identity.email }
          : CONVEX_EMPTY_LOOKUP_RESULT,
    },
    scheduler: {
      runAfter: (_delay, function_reference, function_arguments): string => {
        scheduled_calls.push({ function_reference, function_arguments });
        return `scheduled_${scheduled_calls.length}`;
      },
    },
    tables,
    scheduled_calls,
  };
}

export function get_scheduled_event_types(
  context: FakeConvexContext,
): unknown[] {
  return context.scheduled_calls.map(
    (scheduled_call) => scheduled_call.function_arguments.event_type,
  );
}

export function find_table_rows(
  context: FakeConvexContext,
  table_name: string,
): StoredDocument[] {
  return context.tables.get(table_name) ?? [];
}

export function with_identity(
  context: FakeConvexContext,
  identity: FakeIdentity,
): FakeConvexContext {
  return {
    ...context,
    auth: {
      getUserIdentity: async (): Promise<unknown> =>
        identity.status === FakeIdentityStatus.AUTHENTICATED
          ? { subject: identity.subject, email: identity.email }
          : CONVEX_EMPTY_LOOKUP_RESULT,
    },
  };
}
