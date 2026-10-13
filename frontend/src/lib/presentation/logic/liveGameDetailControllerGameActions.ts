import {
  end_live_game_detail_game,
  type LiveGameDetailGameHandlersCommand,
  start_live_game_detail_game,
} from "./liveGameDetailControllerGameLifecycle";

export function create_live_game_detail_game_handlers(
  command: LiveGameDetailGameHandlersCommand,
): {
  end_game: () => Promise<void>;
  start_game: () => Promise<void>;
} {
  return {
    start_game: () => start_live_game_detail_game(command),
    end_game: () => end_live_game_detail_game(command),
  };
}
