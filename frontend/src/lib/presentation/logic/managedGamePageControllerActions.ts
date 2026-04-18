import type {
  Fixture,
  GamePeriod,
  QuickEventButton,
} from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import type { ManagedGameStartCheck } from "$lib/presentation/logic/managedGamePageTypes";

import { create_managed_game_event_action_handlers } from "./managedGamePageControllerEventActions";
import { create_managed_game_game_action_handlers } from "./managedGamePageControllerGameActions";
import { type ManagedGamePageState } from "./managedGamePageControllerState";

type ManagedGameFixtureUseCases = Pick<
  FixtureUseCasesPort,
  "start_fixture" | "end_fixture" | "record_game_event" | "update_period"
>;

export function create_managed_game_action_handlers(command: {
  before_start: (fixture: Fixture) => Promise<ManagedGameStartCheck>;
  fixture_use_cases: ManagedGameFixtureUseCases;
  get_state: () => ManagedGamePageState;
  goto: (path: string) => Promise<unknown>;
  set_state: (state: ManagedGamePageState) => void;
  start_clock: () => void;
  stop_clock: () => void;
}): {
  cancel_event: () => void;
  change_period: (new_period: GamePeriod) => Promise<void>;
  end_current_period: () => Promise<void>;
  end_game: () => Promise<void>;
  handle_start_click: () => Promise<void>;
  open_event_modal: (
    event_button: QuickEventButton,
    team_side: "home" | "away",
  ) => void;
  record_event: () => Promise<void>;
  start_game: () => Promise<void>;
} {
  const game_action_handlers = create_managed_game_game_action_handlers({
    before_start: command.before_start,
    fixture_use_cases: command.fixture_use_cases,
    get_state: command.get_state,
    goto: command.goto,
    set_state: command.set_state,
    start_clock: command.start_clock,
    stop_clock: command.stop_clock,
  });
  const event_action_handlers = create_managed_game_event_action_handlers({
    fixture_use_cases: command.fixture_use_cases,
    get_state: command.get_state,
    set_state: command.set_state,
  });
  return {
    ...game_action_handlers,
    ...event_action_handlers,
  };
}
