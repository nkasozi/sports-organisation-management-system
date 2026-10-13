import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import { FIXTURE_LINEUP_DETAIL_PAGE_TEXT } from "./fixtureLineupDetailMessages";
import {
  apply_fixture_lineup_detail_error,
  apply_fixture_lineup_detail_loading_flag,
  apply_fixture_lineup_detail_saving_flag,
  FIXTURE_LINEUP_DETAIL_ACTION,
  FIXTURE_LINEUP_DETAIL_INITIAL_STATE,
  FIXTURE_LINEUP_DETAIL_PAGE_STATUS,
  request_fixture_lineup_detail_action,
} from "./fixtureLineupDetailPageStatus";

const READY_STATE = request_fixture_lineup_detail_action(
  FIXTURE_LINEUP_DETAIL_ACTION.NONE,
);

describe("fixture lineup detail page status", () => {
  it("becomes ready when loading completes", () => {
    expect(
      apply_fixture_lineup_detail_loading_flag(
        FIXTURE_LINEUP_DETAIL_INITIAL_STATE,
        false,
      ),
    ).toEqual(READY_STATE);
  });

  it("replaces technical load errors with a friendly message", () => {
    const outcome = apply_fixture_lineup_detail_error(
      FIXTURE_LINEUP_DETAIL_INITIAL_STATE,
      "IndexedDB: transaction aborted",
    );

    expect(outcome.state).toEqual({
      status: FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOAD_FAILED,
      message: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LOAD_FAILED,
    });
    expect(outcome.toast_message).toEqual(create_none_option());
  });

  it("keeps the friendly access check message", () => {
    const outcome = apply_fixture_lineup_detail_error(
      FIXTURE_LINEUP_DETAIL_INITIAL_STATE,
      FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_CHECK_FAILED,
    );

    expect(outcome.state).toEqual({
      status: FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOAD_FAILED,
      message: FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_CHECK_FAILED,
    });
  });

  it("ignores empty error resets", () => {
    const outcome = apply_fixture_lineup_detail_error(READY_STATE, "");

    expect(outcome).toEqual({
      state: READY_STATE,
      toast_message: create_none_option(),
    });
  });

  it("keeps the page usable and toasts when a save fails", () => {
    const requested = request_fixture_lineup_detail_action(
      FIXTURE_LINEUP_DETAIL_ACTION.SAVE,
    );
    const saving = apply_fixture_lineup_detail_saving_flag(requested, true);
    const settled = apply_fixture_lineup_detail_saving_flag(saving, false);
    const outcome = apply_fixture_lineup_detail_error(settled, "db error");

    expect(saving.status).toBe(FIXTURE_LINEUP_DETAIL_PAGE_STATUS.SAVING);
    expect(outcome.state).toEqual(requested);
    expect(outcome.toast_message).toEqual(
      create_some_option(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.UPDATE_FAILED),
    );
  });

  it("uses the submit failure message for submit errors while saving", () => {
    const saving = apply_fixture_lineup_detail_saving_flag(
      request_fixture_lineup_detail_action(FIXTURE_LINEUP_DETAIL_ACTION.SUBMIT),
      true,
    );
    const outcome = apply_fixture_lineup_detail_error(saving, "boom");

    expect(outcome.state.status).toBe(FIXTURE_LINEUP_DETAIL_PAGE_STATUS.READY);
    expect(outcome.toast_message).toEqual(
      create_some_option(FIXTURE_LINEUP_DETAIL_PAGE_TEXT.SUBMIT_FAILED),
    );
  });

  it("does not leave loading via the saving flag", () => {
    expect(
      apply_fixture_lineup_detail_saving_flag(
        FIXTURE_LINEUP_DETAIL_INITIAL_STATE,
        true,
      ),
    ).toEqual(FIXTURE_LINEUP_DETAIL_INITIAL_STATE);
  });
});
