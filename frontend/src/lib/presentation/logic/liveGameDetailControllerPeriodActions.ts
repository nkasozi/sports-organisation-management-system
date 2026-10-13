import {
  confirm_live_game_detail_extra_time,
  confirm_live_game_detail_period,
  type LiveGameDetailPeriodHandlersCommand,
} from "./liveGameDetailControllerPeriodTransitions";

export function create_live_game_detail_period_handlers(
  command: LiveGameDetailPeriodHandlersCommand,
): {
  confirm_extra_time: () => Promise<void>;
  confirm_period_action: () => Promise<void>;
} {
  return {
    confirm_period_action: () => confirm_live_game_detail_period(command),
    confirm_extra_time: () => confirm_live_game_detail_extra_time(command),
  };
}
