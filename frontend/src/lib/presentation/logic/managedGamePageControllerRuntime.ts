import type {
  Fixture,
  GamePeriod,
  QuickEventButton,
} from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import type {
  ManagedGameLoadResult,
  ManagedGameStartCheck,
} from "$lib/presentation/logic/managedGamePageTypes";

import { create_managed_game_action_handlers } from "./managedGamePageControllerActions";
import { create_managed_game_clock_handlers } from "./managedGamePageControllerClock";
import { type ManagedGamePageState } from "./managedGamePageControllerState";

type ManagedGameFixtureUseCases = Pick<
  FixtureUseCasesPort,
  "start_fixture" | "end_fixture" | "record_game_event" | "update_period"
>;

export function create_managed_game_controller_runtime(command: {
  before_start: (fixture: Fixture | null) => Promise<ManagedGameStartCheck>;
  fixture_use_cases: ManagedGameFixtureUseCases;
  get_fixture_id: () => string;
  get_state: () => ManagedGamePageState;
  goto: (path: string) => Promise<unknown>;
  load_bundle: (fixture_id: string) => Promise<ManagedGameLoadResult>;
  set_state: (state: ManagedGamePageState) => void;
}): {
  change_period: (new_period: GamePeriod) => Promise<void>;
  cleanup: () => void;
  end_current_period: () => Promise<void>;
  end_game: () => Promise<void>;
  handle_start_click: () => Promise<void>;
  initialize: () => Promise<void>;
  open_event_modal: (
    event_button: QuickEventButton,
    team_side: "home" | "away",
  ) => void;
  record_event: () => Promise<void>;
  start_game: () => Promise<void>;
  stop_clock: () => void;
  toggle_clock: () => void;
  cancel_event: () => void;
} {
  const clock_handlers = create_managed_game_clock_handlers({
    get_fixture_id: command.get_fixture_id,
    get_state: command.get_state,
    load_bundle: command.load_bundle,
    set_state: command.set_state,
  });
  const action_handlers = create_managed_game_action_handlers({
    before_start: command.before_start,
    fixture_use_cases: command.fixture_use_cases,
    get_state: command.get_state,
    goto: command.goto,
    set_state: command.set_state,
    start_clock: clock_handlers.start_clock,
    stop_clock: clock_handlers.stop_clock,
  });
  return {
    ...clock_handlers,
    ...action_handlers,
  };
}
