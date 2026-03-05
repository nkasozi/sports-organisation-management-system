import type {
  GameEventLog,
  CreateGameEventLogInput,
  UpdateGameEventLogInput,
} from "../../../../entities/GameEventLog";
import type { GameEventLogFilter } from "../../external/repositories/GameEventLogRepository";
import type { EntityListResult } from "../../../../entities/BaseEntity";
import type { AsyncResult } from "../../../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface GameEventLogUseCasesPort extends BaseUseCasesPort<
  GameEventLog,
  CreateGameEventLogInput,
  UpdateGameEventLogInput,
  GameEventLogFilter
> {
  get_events_for_live_game(
    live_game_log_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>>;

  get_events_for_fixture(
    fixture_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>>;

  get_events_for_player(
    player_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>>;

  get_scoring_events_for_live_game(
    live_game_log_id: string,
  ): Promise<EntityListResult<GameEventLog>>;

  get_card_events_for_live_game(
    live_game_log_id: string,
  ): Promise<EntityListResult<GameEventLog>>;

  void_event(
    id: string,
    reason: string,
    voided_by_user_id: string,
  ): AsyncResult<GameEventLog>;

  record_goal(
    live_game_log_id: string,
    fixture_id: string,
    organization_id: string,
    minute: number,
    team_side: "home" | "away",
    player_id: string,
    player_name: string,
    recorded_by_user_id: string,
  ): AsyncResult<GameEventLog>;

  record_card(
    live_game_log_id: string,
    fixture_id: string,
    organization_id: string,
    minute: number,
    team_side: "home" | "away",
    player_id: string,
    player_name: string,
    card_type: "yellow_card" | "red_card" | "second_yellow" | "green_card",
    recorded_by_user_id: string,
  ): AsyncResult<GameEventLog>;

  record_substitution(
    live_game_log_id: string,
    fixture_id: string,
    organization_id: string,
    minute: number,
    team_side: "home" | "away",
    player_out_id: string,
    player_out_name: string,
    player_in_id: string,
    player_in_name: string,
    recorded_by_user_id: string,
  ): AsyncResult<GameEventLog>;
}
