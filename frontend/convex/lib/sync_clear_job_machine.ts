import {
  ClearCursorKind,
  type ClearJobEvent,
  ClearJobEventType,
  ClearJobFailureReason,
  type ClearJobState,
  ClearJobStatus,
  MAX_CLEAR_JOB_CONTINUATIONS,
} from "./sync_clear_job_types";

const START_CURSOR_LOCAL_ID = "";

function advance_after_page(
  state: ClearJobState,
  event: Extract<
    ClearJobEvent,
    { type: typeof ClearJobEventType.PAGE_PROCESSED }
  >,
): ClearJobState {
  const counted = {
    ...state,
    deleted_count: state.deleted_count + event.deleted_count,
    rejected_count: state.rejected_count + event.rejected_count,
  };
  if (event.page_was_full)
    return {
      ...counted,
      cursor_kind: ClearCursorKind.AFTER,
      cursor_local_id: event.last_scanned_local_id,
    };
  const next_table_index = state.table_index + 1;
  return {
    ...counted,
    table_index: next_table_index,
    cursor_kind: ClearCursorKind.START,
    cursor_local_id: START_CURSOR_LOCAL_ID,
    status:
      next_table_index >= state.table_names.length
        ? ClearJobStatus.COMPLETED
        : ClearJobStatus.RUNNING,
  };
}

function record_continuation(state: ClearJobState): ClearJobState {
  const continuation_count = state.continuation_count + 1;
  return continuation_count > MAX_CLEAR_JOB_CONTINUATIONS
    ? {
        ...state,
        continuation_count,
        status: ClearJobStatus.FAILED,
        failure_reason: ClearJobFailureReason.CONTINUATION_LIMIT_REACHED,
      }
    : { ...state, continuation_count };
}

export function transition_clear_job(
  state: ClearJobState,
  event: ClearJobEvent,
  now_iso: string,
): ClearJobState {
  if (state.status !== ClearJobStatus.RUNNING) return state;
  switch (event.type) {
    case ClearJobEventType.PAGE_PROCESSED:
      return { ...advance_after_page(state, event), updated_at: now_iso };
    case ClearJobEventType.ACCESS_REVOKED:
      return {
        ...state,
        status: ClearJobStatus.FAILED,
        failure_reason: ClearJobFailureReason.REQUESTER_ACCESS_REVOKED,
        updated_at: now_iso,
      };
    case ClearJobEventType.CONTINUATION_SCHEDULED:
      return { ...record_continuation(state), updated_at: now_iso };
    case ClearJobEventType.TABLE_REJECTED:
      return {
        ...state,
        status: ClearJobStatus.FAILED,
        failure_reason: ClearJobFailureReason.INVALID_TABLE,
        updated_at: now_iso,
      };
  }
}

export function create_clear_job_state(command: {
  kind: ClearJobState["kind"];
  requester_email: string;
  permission_entity_type: string;
  table_names: string[];
  sequence_ceilings: number[];
  now_iso: string;
}): ClearJobState {
  return {
    kind: command.kind,
    requester_email: command.requester_email,
    permission_entity_type: command.permission_entity_type,
    table_names: command.table_names,
    sequence_ceilings: command.sequence_ceilings,
    status:
      command.table_names.length === 0
        ? ClearJobStatus.COMPLETED
        : ClearJobStatus.RUNNING,
    table_index: 0,
    cursor_kind: ClearCursorKind.START,
    cursor_local_id: START_CURSOR_LOCAL_ID,
    deleted_count: 0,
    rejected_count: 0,
    continuation_count: 0,
    failure_reason: ClearJobFailureReason.NONE,
    created_at: command.now_iso,
    updated_at: command.now_iso,
  };
}
