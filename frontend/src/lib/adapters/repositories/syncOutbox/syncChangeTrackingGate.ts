import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

import {
  create_untracked_write_scope,
  type UntrackedWriteScope,
} from "./untrackedWriteScopeToken";

export const UntrackedWriteReason = {
  REMOTE_APPLY: "remote_apply",
  BACKUP_RESTORE: "backup_restore",
  DATA_RESET: "data_reset",
  DEMO_SEED: "demo_seed",
} as const;

export type UntrackedWriteReasonValue =
  (typeof UntrackedWriteReason)[keyof typeof UntrackedWriteReason];

export type { UntrackedWriteScope } from "./untrackedWriteScopeToken";

export interface ChangeTrackingGate {
  mark_untracked_transaction(
    low_level_transaction: object,
    reason: UntrackedWriteReasonValue,
  ): boolean;
  mark_remote_apply_transaction(low_level_transaction: object): boolean;
  begin_untracked_write_scope(
    reason: UntrackedWriteReasonValue,
  ): UntrackedWriteScope;
  describe_untracked_reason(
    low_level_transaction: object,
  ): Option<UntrackedWriteReasonValue>;
  should_track_write(low_level_transaction: object): boolean;
}

const UNTRACKED_SCOPE_ID_PREFIX = "untracked_scope_";

export function create_change_tracking_gate(): ChangeTrackingGate {
  const untracked_transactions = new WeakMap<
    object,
    UntrackedWriteReasonValue
  >();
  let opened_scope_count = 0;
  const mark = (
    low_level_transaction: object,
    reason: UntrackedWriteReasonValue,
  ): boolean => {
    untracked_transactions.set(low_level_transaction, reason);
    return true;
  };
  return {
    mark_untracked_transaction: mark,
    mark_remote_apply_transaction: (low_level_transaction: object): boolean =>
      mark(low_level_transaction, UntrackedWriteReason.REMOTE_APPLY),
    begin_untracked_write_scope: (
      reason: UntrackedWriteReasonValue,
    ): UntrackedWriteScope => {
      opened_scope_count += 1;
      return create_untracked_write_scope({
        reason,
        scope_id: `${UNTRACKED_SCOPE_ID_PREFIX}${opened_scope_count}`,
        mark_untracked_transaction: mark,
      });
    },
    describe_untracked_reason: (
      low_level_transaction: object,
    ): Option<UntrackedWriteReasonValue> => {
      const reason = untracked_transactions.get(low_level_transaction);
      return reason ? create_some_option(reason) : create_none_option();
    },
    should_track_write: (low_level_transaction: object): boolean =>
      !untracked_transactions.has(low_level_transaction),
  };
}

export const sync_change_tracking_gate = create_change_tracking_gate();
