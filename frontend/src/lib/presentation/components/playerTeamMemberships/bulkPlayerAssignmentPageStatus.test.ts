import { describe, expect, it } from "vitest";

import {
  apply_bulk_assignment_error_message,
  apply_bulk_assignment_loading_flag,
  apply_bulk_assignment_saving_flag,
  BULK_PLAYER_ASSIGNMENT_INITIAL_STATE,
  BULK_PLAYER_ASSIGNMENT_PAGE_STATUS,
} from "./bulkPlayerAssignmentPageStatus";

const READY_STATE = {
  status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.READY,
} as const;

describe("bulk player assignment page status transitions", () => {
  it("moves from loading to ready when loading finishes without an error", () => {
    const empty_error_state = apply_bulk_assignment_error_message(
      BULK_PLAYER_ASSIGNMENT_INITIAL_STATE,
      "",
    );

    expect(
      apply_bulk_assignment_loading_flag(empty_error_state, false),
    ).toEqual(READY_STATE);
  });

  it("keeps the failure when loading finishes after an error", () => {
    const failed_state = apply_bulk_assignment_error_message(
      BULK_PLAYER_ASSIGNMENT_INITIAL_STATE,
      "Failed to load teams",
    );

    expect(apply_bulk_assignment_loading_flag(failed_state, false)).toEqual({
      status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.FAILED,
      message: "Failed to load teams",
    });
  });

  it("enters and leaves the saving state", () => {
    const saving_state = apply_bulk_assignment_saving_flag(READY_STATE, true);

    expect(saving_state).toEqual({
      status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.SAVING,
    });
    expect(apply_bulk_assignment_saving_flag(saving_state, false)).toEqual(
      READY_STATE,
    );
  });

  it("ignores a saving reset when not saving", () => {
    expect(
      apply_bulk_assignment_saving_flag(
        BULK_PLAYER_ASSIGNMENT_INITIAL_STATE,
        false,
      ),
    ).toEqual(BULK_PLAYER_ASSIGNMENT_INITIAL_STATE);
  });

  it("re-enters loading when asked", () => {
    expect(apply_bulk_assignment_loading_flag(READY_STATE, true)).toEqual(
      BULK_PLAYER_ASSIGNMENT_INITIAL_STATE,
    );
  });
});
