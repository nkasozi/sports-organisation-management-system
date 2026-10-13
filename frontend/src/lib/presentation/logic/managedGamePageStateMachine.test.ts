import { describe, expect, it } from "vitest";

import { create_managed_game_page_state } from "./managedGamePageControllerState";
import {
  begin_managed_game_page_load,
  close_managed_game_confirmation_modals,
  complete_managed_game_page_load,
  derive_managed_game_open_modal,
  derive_managed_game_page_status,
  fail_managed_game_page_load,
  MANAGED_GAME_MODAL,
  MANAGED_GAME_PAGE_STATUS,
  open_managed_game_confirmation_modal,
} from "./managedGamePageStateMachine";

describe("managedGamePageStateMachine", () => {
  it("moves from loading to ready and to load failed", () => {
    const loading = begin_managed_game_page_load(
      create_managed_game_page_state(),
    );
    expect(derive_managed_game_page_status(loading)).toEqual({
      status: MANAGED_GAME_PAGE_STATUS.LOADING,
    });
    expect(
      derive_managed_game_page_status(complete_managed_game_page_load(loading)),
    ).toEqual({ status: MANAGED_GAME_PAGE_STATUS.READY });
    expect(
      derive_managed_game_page_status(
        fail_managed_game_page_load(loading, "We couldn't load this game."),
      ),
    ).toEqual({
      status: MANAGED_GAME_PAGE_STATUS.LOAD_FAILED,
      error_message: "We couldn't load this game.",
    });
  });

  it("reports updating while an action is in flight", () => {
    const state = {
      ...complete_managed_game_page_load(create_managed_game_page_state()),
      is_updating: true,
    };
    expect(derive_managed_game_page_status(state).status).toBe(
      MANAGED_GAME_PAGE_STATUS.UPDATING,
    );
  });

  it("keeps at most one confirmation modal open", () => {
    const start_open = open_managed_game_confirmation_modal(
      create_managed_game_page_state(),
      MANAGED_GAME_MODAL.START,
    );
    const end_open = open_managed_game_confirmation_modal(
      start_open,
      MANAGED_GAME_MODAL.END,
    );
    expect(derive_managed_game_open_modal(start_open)).toBe(
      MANAGED_GAME_MODAL.START,
    );
    expect(end_open.show_start_modal).toBe(false);
    expect(derive_managed_game_open_modal(end_open)).toBe(
      MANAGED_GAME_MODAL.END,
    );
    expect(
      derive_managed_game_open_modal(
        close_managed_game_confirmation_modals(end_open),
      ),
    ).toBe(MANAGED_GAME_MODAL.NONE);
  });
});
