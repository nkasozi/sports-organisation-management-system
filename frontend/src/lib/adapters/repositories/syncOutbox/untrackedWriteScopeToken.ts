import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import type { UntrackedWriteReasonValue } from "./syncChangeTrackingGate";

export const UntrackedWriteScopeStatus = {
  OPEN: "open",
  CLOSED: "closed",
} as const;

export type UntrackedWriteScopeStatusValue =
  (typeof UntrackedWriteScopeStatus)[keyof typeof UntrackedWriteScopeStatus];

const UNTRACKED_WRITE_SCOPE_CLOSED_ERROR =
  "Untracked write scope is already closed";

export interface UntrackedWriteScope {
  readonly reason: UntrackedWriteReasonValue;
  readonly scope_id: string;
  read_status(): UntrackedWriteScopeStatusValue;
  mark_transaction(
    low_level_transaction: object,
  ): Result<UntrackedWriteReasonValue>;
  end(): boolean;
}

interface UntrackedWriteScopeCommand {
  reason: UntrackedWriteReasonValue;
  scope_id: string;
  mark_untracked_transaction(
    low_level_transaction: object,
    reason: UntrackedWriteReasonValue,
  ): boolean;
}

function mark_when_open(
  status: UntrackedWriteScopeStatusValue,
  command: UntrackedWriteScopeCommand,
  low_level_transaction: object,
): Result<UntrackedWriteReasonValue> {
  switch (status) {
    case UntrackedWriteScopeStatus.OPEN:
      command.mark_untracked_transaction(low_level_transaction, command.reason);
      return create_success_result(command.reason);
    case UntrackedWriteScopeStatus.CLOSED:
      return create_failure_result(UNTRACKED_WRITE_SCOPE_CLOSED_ERROR);
  }
}

export function create_untracked_write_scope(
  command: UntrackedWriteScopeCommand,
): UntrackedWriteScope {
  let status: UntrackedWriteScopeStatusValue = UntrackedWriteScopeStatus.OPEN;
  return {
    reason: command.reason,
    scope_id: command.scope_id,
    read_status: (): UntrackedWriteScopeStatusValue => status,
    mark_transaction: (
      low_level_transaction: object,
    ): Result<UntrackedWriteReasonValue> =>
      mark_when_open(status, command, low_level_transaction),
    end: (): boolean => {
      status = UntrackedWriteScopeStatus.CLOSED;
      return true;
    },
  };
}
