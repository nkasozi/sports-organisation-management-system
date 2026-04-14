import type {
  CreateGameEventLogInput,
  GameEventLog,
  UpdateGameEventLogInput,
} from "../../../../entities/GameEventLog";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { GameEventLogFilter } from "../../external/repositories/GameEventLogRepository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface GameEventLogUseCasesPort extends BaseUseCasesPort<
  GameEventLog,
  CreateGameEventLogInput,
  UpdateGameEventLogInput,
  GameEventLogFilter
> {
  get_events_for_live_game(
    live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<GameEventLog>;

  get_events_for_fixture(
    fixture_id: ScalarValueInput<GameEventLog["fixture_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<GameEventLog>;

  get_events_for_player(
    player_id: ScalarValueInput<GameEventLog["player_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<GameEventLog>;

  get_scoring_events_for_live_game(
    live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
  ): AsyncResult<GameEventLog[]>;

  get_card_events_for_live_game(
    live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
  ): AsyncResult<GameEventLog[]>;

  void_event(
    id: ScalarValueInput<GameEventLog["id"]>,
    reason: string,
    voided_by_user_id: ScalarValueInput<GameEventLog["reviewed_by_user_id"]>,
  ): AsyncResult<GameEventLog>;

  record_goal(
    live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
    fixture_id: ScalarValueInput<GameEventLog["fixture_id"]>,
    organization_id: ScalarValueInput<GameEventLog["organization_id"]>,
    minute: ScalarValueInput<GameEventLog["minute"]>,
    team_side: "home" | "away",
    player_id: ScalarValueInput<GameEventLog["player_id"]>,
    player_name: ScalarValueInput<GameEventLog["player_name"]>,
    recorded_by_user_id: ScalarValueInput<GameEventLog["recorded_by_user_id"]>,
  ): AsyncResult<GameEventLog>;

  record_card(
    live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
    fixture_id: ScalarValueInput<GameEventLog["fixture_id"]>,
    organization_id: ScalarValueInput<GameEventLog["organization_id"]>,
    minute: ScalarValueInput<GameEventLog["minute"]>,
    team_side: "home" | "away",
    player_id: ScalarValueInput<GameEventLog["player_id"]>,
    player_name: ScalarValueInput<GameEventLog["player_name"]>,
    card_type: "yellow_card" | "red_card" | "second_yellow" | "green_card",
    recorded_by_user_id: ScalarValueInput<GameEventLog["recorded_by_user_id"]>,
  ): AsyncResult<GameEventLog>;

  record_substitution(
    live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
    fixture_id: ScalarValueInput<GameEventLog["fixture_id"]>,
    organization_id: ScalarValueInput<GameEventLog["organization_id"]>,
    minute: ScalarValueInput<GameEventLog["minute"]>,
    team_side: "home" | "away",
    player_out_id: ScalarValueInput<GameEventLog["player_id"]>,
    player_out_name: ScalarValueInput<GameEventLog["player_name"]>,
    player_in_id: ScalarValueInput<GameEventLog["secondary_player_id"]>,
    player_in_name: ScalarValueInput<GameEventLog["secondary_player_name"]>,
    recorded_by_user_id: ScalarValueInput<GameEventLog["recorded_by_user_id"]>,
  ): AsyncResult<GameEventLog>;
}
