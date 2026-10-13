import type { Table } from "dexie";

import type { AsyncResult } from "../../core/types/Result";
import { create_failure_result } from "../../core/types/Result";
import {
  type UntrackedWriteScope,
  UntrackedWriteScopeStatus,
} from "./syncOutbox/untrackedWriteScopeToken";

export const RepositoryWriteOriginKind = {
  USER: "user",
  SYSTEM: "system",
} as const;

export type RepositoryWriteOrigin =
  | { kind: typeof RepositoryWriteOriginKind.USER }
  | {
      kind: typeof RepositoryWriteOriginKind.SYSTEM;
      scope: UntrackedWriteScope;
    };

export const REPOSITORY_WRITE_ORIGIN_MESSAGE = {
  SYSTEM_SCOPE_CLOSED:
    "This data maintenance step has already finished. Please refresh and try again.",
  SYSTEM_WRITE_FAILED:
    "We could not finish preparing your data. Please try again.",
} as const;

const REPOSITORY_WRITE_ORIGIN_EVENT = {
  SYSTEM_SCOPE_CLOSED: "repository_system_write_rejected_scope_closed",
  SYSTEM_WRITE_FAILED: "repository_system_write_failed",
} as const;

const SYSTEM_WRITE_TRANSACTION_MODE = "rw";

export const USER_WRITE_ORIGIN: RepositoryWriteOrigin = {
  kind: RepositoryWriteOriginKind.USER,
};

export function create_system_write_origin(
  scope: UntrackedWriteScope,
): RepositoryWriteOrigin {
  return { kind: RepositoryWriteOriginKind.SYSTEM, scope };
}

function describe_system_write(
  table_name: string,
  scope: UntrackedWriteScope,
): Record<string, string> {
  return {
    table: table_name,
    reason: scope.reason,
    correlation_id: scope.scope_id,
  };
}

async function run_marked_system_write<TEntity, TData>(
  table: Table<TEntity, string>,
  scope: UntrackedWriteScope,
  write: () => AsyncResult<TData>,
): AsyncResult<TData> {
  try {
    return await table.db.transaction(
      SYSTEM_WRITE_TRANSACTION_MODE,
      table,
      (transaction): AsyncResult<TData> => {
        const marked = scope.mark_transaction(transaction.idbtrans);
        return marked.success ? write() : reject_closed_scope(table, scope);
      },
    );
  } catch (error) {
    console.error("[Repository] System-origin write failed", {
      event: REPOSITORY_WRITE_ORIGIN_EVENT.SYSTEM_WRITE_FAILED,
      ...describe_system_write(table.name, scope),
      error: String(error),
    });
    return create_failure_result(
      REPOSITORY_WRITE_ORIGIN_MESSAGE.SYSTEM_WRITE_FAILED,
    );
  }
}

async function reject_closed_scope<TEntity, TData>(
  table: Table<TEntity, string>,
  scope: UntrackedWriteScope,
): AsyncResult<TData> {
  console.error("[Repository] System-origin write rejected: scope closed", {
    event: REPOSITORY_WRITE_ORIGIN_EVENT.SYSTEM_SCOPE_CLOSED,
    ...describe_system_write(table.name, scope),
  });
  return create_failure_result(
    REPOSITORY_WRITE_ORIGIN_MESSAGE.SYSTEM_SCOPE_CLOSED,
  );
}

function run_system_origin_write<TEntity, TData>(
  table: Table<TEntity, string>,
  scope: UntrackedWriteScope,
  write: () => AsyncResult<TData>,
): AsyncResult<TData> {
  switch (scope.read_status()) {
    case UntrackedWriteScopeStatus.OPEN:
      return run_marked_system_write(table, scope, write);
    case UntrackedWriteScopeStatus.CLOSED:
      return reject_closed_scope(table, scope);
  }
}

export function run_repository_write<TEntity, TData>(
  table: Table<TEntity, string>,
  origin: RepositoryWriteOrigin,
  write: () => AsyncResult<TData>,
): AsyncResult<TData> {
  switch (origin.kind) {
    case RepositoryWriteOriginKind.USER:
      return write();
    case RepositoryWriteOriginKind.SYSTEM:
      return run_system_origin_write(table, origin.scope, write);
  }
}

export interface WriteOriginBindable<TRepository> {
  with_write_origin(origin: RepositoryWriteOrigin): TRepository;
}

export function bind_repository_to_origin<
  TRepository extends WriteOriginBindable<TRepository>,
>(repository: TRepository, origin: RepositoryWriteOrigin): TRepository {
  switch (origin.kind) {
    case RepositoryWriteOriginKind.USER:
      return repository;
    case RepositoryWriteOriginKind.SYSTEM:
      return repository.with_write_origin(origin);
  }
}
