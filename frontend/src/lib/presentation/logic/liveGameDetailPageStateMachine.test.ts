import { describe, expect, it } from "vitest";

import { create_live_game_detail_page_state } from "./liveGameDetailPageStateFactories";
import {
  begin_live_game_detail_load,
  build_live_game_detail_modal_state,
  derive_live_game_detail_open_modal,
  derive_live_game_detail_page_status,
  fail_live_game_detail_load,
  finish_live_game_detail_load,
  LIVE_GAME_DETAIL_MODAL,
  LIVE_GAME_DETAIL_PAGE_STATUS,
} from "./liveGameDetailPageStateMachine";

describe("liveGameDetailPageStateMachine", () => {
  it("transitions through loading, ready, updating and load failed", () => {
    const loading = begin_live_game_detail_load(
      create_live_game_detail_page_state(),
    );
    const ready = finish_live_game_detail_load(loading);
    expect(derive_live_game_detail_page_status(loading).status).toBe(
      LIVE_GAME_DETAIL_PAGE_STATUS.LOADING,
    );
    expect(derive_live_game_detail_page_status(ready).status).toBe(
      LIVE_GAME_DETAIL_PAGE_STATUS.READY,
    );
    expect(
      derive_live_game_detail_page_status({ ...ready, is_updating: true })
        .status,
    ).toBe(LIVE_GAME_DETAIL_PAGE_STATUS.UPDATING);
    expect(
      derive_live_game_detail_page_status(
        fail_live_game_detail_load(loading, "We couldn't load this game."),
      ),
    ).toEqual({
      status: LIVE_GAME_DETAIL_PAGE_STATUS.LOAD_FAILED,
      error_message: "We couldn't load this game.",
    });
  });

  it("builds modal state with exactly one modal open", () => {
    for (const modal of Object.values(LIVE_GAME_DETAIL_MODAL)) {
      const modal_state = build_live_game_detail_modal_state(modal);
      const open_count = Object.values(modal_state).filter(Boolean).length;
      expect(open_count).toBe(modal === LIVE_GAME_DETAIL_MODAL.NONE ? 0 : 1);
      expect(derive_live_game_detail_open_modal(modal_state)).toBe(modal);
    }
  });
});
