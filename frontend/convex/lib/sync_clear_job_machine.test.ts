import { describe, expect, it } from "vitest";

import {
  create_clear_job_state,
  transition_clear_job,
} from "./sync_clear_job_machine";
import {
  type ClearJobEvent,
  ClearJobEventType,
  ClearJobKind,
  type ClearJobState,
  ClearJobStatus,
  MAX_CLEAR_JOB_CONTINUATIONS,
} from "./sync_clear_job_types";

const NOW = "2024-06-01T00:00:00.000Z";

function create_job(table_names: string[]): ClearJobState {
  return create_clear_job_state({
    kind: ClearJobKind.CLEAR_ALL_DEMO_DATA,
    requester_email: "root@example.com",
    permission_entity_type: "organization",
    table_names,
    sequence_ceilings: table_names.map(() => 10),
    now_iso: NOW,
  });
}

function page(
  page_was_full: boolean,
  last_scanned_local_id = "team_9",
): Extract<ClearJobEvent, { type: typeof ClearJobEventType.PAGE_PROCESSED }> {
  return {
    type: ClearJobEventType.PAGE_PROCESSED,
    deleted_count: 2,
    rejected_count: 1,
    last_scanned_local_id,
    page_was_full,
  } as const;
}

describe("clear job state machine", () => {
  it("completes immediately when there is nothing to clear", () => {
    expect(create_job([]).status).toBe(ClearJobStatus.COMPLETED);
  });

  it("keeps a cursor inside a table while pages are full", () => {
    const state = transition_clear_job(create_job(["teams"]), page(true), NOW);
    expect(state).toMatchObject({
      status: ClearJobStatus.RUNNING,
      table_index: 0,
      cursor_kind: "after",
      cursor_local_id: "team_9",
      deleted_count: 2,
      rejected_count: 1,
    });
  });

  it("moves to the next table and completes after the last one", () => {
    const first = transition_clear_job(
      create_job(["teams", "players"]),
      page(false),
      NOW,
    );
    expect(first).toMatchObject({ table_index: 1, cursor_kind: "start" });
    const done = transition_clear_job(first, page(false), NOW);
    expect(done.status).toBe(ClearJobStatus.COMPLETED);
    expect(transition_clear_job(done, page(true), NOW)).toBe(done);
  });

  it("fails explicitly when access is revoked or continuations run away", () => {
    expect(
      transition_clear_job(
        create_job(["teams"]),
        { type: ClearJobEventType.ACCESS_REVOKED },
        NOW,
      ),
    ).toMatchObject({
      status: ClearJobStatus.FAILED,
      failure_reason: "requester_access_revoked",
    });
    const exhausted = transition_clear_job(
      {
        ...create_job(["teams"]),
        continuation_count: MAX_CLEAR_JOB_CONTINUATIONS,
      },
      { type: ClearJobEventType.CONTINUATION_SCHEDULED },
      NOW,
    );
    expect(exhausted).toMatchObject({
      status: ClearJobStatus.FAILED,
      failure_reason: "continuation_limit_reached",
    });
  });
});
