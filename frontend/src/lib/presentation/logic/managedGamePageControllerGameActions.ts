import type { GamePeriod } from "$lib/core/entities/Fixture";

import {
  end_managed_game_page_game,
  handle_managed_game_start_click,
  start_managed_game_page_game,
} from "./managedGamePageControllerGameLifecycle";
import type { ManagedGameGameHandlersCommand } from "./managedGamePageControllerGameOutcomes";
import {
  change_managed_game_page_period,
  end_managed_game_page_current_period,
} from "./managedGamePageControllerPeriodTransitions";

export function create_managed_game_game_action_handlers(
  command: ManagedGameGameHandlersCommand,
): {
  change_period: (new_period: GamePeriod) => Promise<void>;
  end_current_period: () => Promise<void>;
  end_game: () => Promise<void>;
  handle_start_click: () => Promise<void>;
  start_game: () => Promise<void>;
} {
  return {
    handle_start_click: () => handle_managed_game_start_click(command),
    start_game: () => start_managed_game_page_game(command),
    end_game: () => end_managed_game_page_game(command),
    change_period: (new_period) =>
      change_managed_game_page_period(command, new_period),
    end_current_period: () => end_managed_game_page_current_period(command),
  };
}
