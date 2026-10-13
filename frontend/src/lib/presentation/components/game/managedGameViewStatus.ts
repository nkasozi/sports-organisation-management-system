import type { Fixture } from "$lib/core/entities/Fixture";
import type { ManagedGamePageState } from "$lib/presentation/logic/managedGamePageControllerState";
import {
  derive_managed_game_page_status,
  MANAGED_GAME_PAGE_STATUS,
} from "$lib/presentation/logic/managedGamePageStateMachine";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

export const MANAGED_GAME_VIEW_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  EMPTY: "empty",
  READY: "ready",
} as const;

export type ManagedGameViewStatusState =
  | { status: typeof MANAGED_GAME_VIEW_STATUS.LOADING }
  | { status: typeof MANAGED_GAME_VIEW_STATUS.FAILED; message: string }
  | { status: typeof MANAGED_GAME_VIEW_STATUS.EMPTY }
  | { status: typeof MANAGED_GAME_VIEW_STATUS.READY; fixture: Fixture };

export function build_managed_game_view_status(
  source: ManagedGamePageState,
): ManagedGameViewStatusState {
  const page_status = derive_managed_game_page_status(source);
  switch (page_status.status) {
    case MANAGED_GAME_PAGE_STATUS.LOADING:
      return { status: MANAGED_GAME_VIEW_STATUS.LOADING };
    case MANAGED_GAME_PAGE_STATUS.LOAD_FAILED:
      return {
        status: MANAGED_GAME_VIEW_STATUS.FAILED,
        message: page_status.error_message,
      };
    case MANAGED_GAME_PAGE_STATUS.READY:
    case MANAGED_GAME_PAGE_STATUS.UPDATING:
      return source.fixture.status === PRESENCE_STATUS.MISSING
        ? { status: MANAGED_GAME_VIEW_STATUS.EMPTY }
        : {
            status: MANAGED_GAME_VIEW_STATUS.READY,
            fixture: source.fixture.fixture,
          };
  }
}
