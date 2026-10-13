import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import {
  create_managed_game_page_state,
  type ManagedGamePageState,
} from "$lib/presentation/logic/managedGamePageControllerState";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  build_managed_game_view_status,
  MANAGED_GAME_VIEW_STATUS,
} from "./managedGameViewStatus";

const fixture = { id: "fixture-1" } as Fixture;

function build_state(
  overrides: Partial<ManagedGamePageState>,
): ManagedGamePageState {
  return { ...create_managed_game_page_state(), ...overrides };
}

describe("build_managed_game_view_status", () => {
  it("shows loading first", () => {
    expect(
      build_managed_game_view_status(
        build_state({ is_loading: true, error_message: "x" }),
      ),
    ).toEqual({ status: MANAGED_GAME_VIEW_STATUS.LOADING });
  });

  it("shows failures", () => {
    expect(
      build_managed_game_view_status(
        build_state({ is_loading: false, error_message: "Could not load" }),
      ),
    ).toEqual({
      status: MANAGED_GAME_VIEW_STATUS.FAILED,
      message: "Could not load",
    });
  });

  it("is empty without a fixture and ready with one, even while updating", () => {
    expect(
      build_managed_game_view_status(build_state({ is_loading: false })),
    ).toEqual({ status: MANAGED_GAME_VIEW_STATUS.EMPTY });
    expect(
      build_managed_game_view_status(
        build_state({
          is_loading: false,
          is_updating: true,
          fixture: { status: PRESENCE_STATUS.PRESENT, fixture },
        }),
      ),
    ).toEqual({ status: MANAGED_GAME_VIEW_STATUS.READY, fixture });
  });
});
