import { describe, expect, it } from "vitest";

import {
  LOADING_STATE,
  LOADING_WRAPPER_VIEW,
  resolve_loading_wrapper_view,
} from "./loadingStateWrapperLogic";

describe("resolve_loading_wrapper_view", () => {
  it.each([
    [LOADING_STATE.IDLE, false, LOADING_WRAPPER_VIEW.EMPTY],
    [LOADING_STATE.IDLE, true, LOADING_WRAPPER_VIEW.EMPTY],
    [LOADING_STATE.LOADING, false, LOADING_WRAPPER_VIEW.SPINNER],
    [LOADING_STATE.LOADING, true, LOADING_WRAPPER_VIEW.CONTENT_WITH_OVERLAY],
    [LOADING_STATE.SUCCESS, false, LOADING_WRAPPER_VIEW.CONTENT],
    [LOADING_STATE.SUCCESS, true, LOADING_WRAPPER_VIEW.CONTENT],
    [LOADING_STATE.ERROR, false, LOADING_WRAPPER_VIEW.ERROR],
    [LOADING_STATE.ERROR, true, LOADING_WRAPPER_VIEW.ERROR],
  ])(
    "maps %s with show_content_while_loading=%s to %s",
    (state, show_content_while_loading, expected_view) => {
      expect(
        resolve_loading_wrapper_view(state, show_content_while_loading),
      ).toBe(expected_view);
    },
  );
});
