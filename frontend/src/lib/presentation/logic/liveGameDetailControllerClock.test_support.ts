import { type Mock, vi } from "vitest";

import { create_live_game_detail_clock_handlers } from "./liveGameDetailControllerClock";
import { create_live_game_detail_page_state } from "./liveGameDetailPageStateFactories";

type LiveGameDetailPageStateUnderTest = ReturnType<
  typeof create_live_game_detail_page_state
>;

interface LiveGameDetailClockStateStore {
  get_page_state: () => LiveGameDetailPageStateUnderTest;
  read_page_state: () => LiveGameDetailPageStateUnderTest;
  set_page_state: (next_state: LiveGameDetailPageStateUnderTest) => void;
}

interface LiveGameDetailClockHandlerOverrides {
  goto?: Mock;
  raw_token?: string;
  save_clock_snapshot?: Mock;
  now?: () => Date;
}

export const CLOCK_TEST_NOW = new Date("2024-06-01T10:00:00.000Z");

export function create_state_store(): LiveGameDetailClockStateStore {
  let page_state = create_live_game_detail_page_state();
  return {
    get_page_state: () => page_state,
    read_page_state: () => page_state,
    set_page_state: (next_state: LiveGameDetailPageStateUnderTest) => {
      page_state = next_state;
    },
  };
}

export function create_clock_handlers(
  state_store: LiveGameDetailClockStateStore,
  overrides: LiveGameDetailClockHandlerOverrides = {},
): ReturnType<typeof create_live_game_detail_clock_handlers> {
  const raw_token = overrides.raw_token ?? "";
  const save_clock_snapshot =
    overrides.save_clock_snapshot ??
    vi.fn().mockResolvedValue({ success: true, data: {} });
  return create_live_game_detail_clock_handlers(
    {
      data_dependencies: {
        fixture_use_cases: { save_clock_snapshot },
      } as never,
      fixture_id: () => "fixture-1",
      get_event_state: vi.fn(),
      get_page_state: state_store.get_page_state,
      goto: overrides.goto ?? vi.fn(),
      raw_token: () => raw_token,
      set_page_state: state_store.set_page_state,
    },
    overrides.now ?? (() => new Date()),
  );
}
