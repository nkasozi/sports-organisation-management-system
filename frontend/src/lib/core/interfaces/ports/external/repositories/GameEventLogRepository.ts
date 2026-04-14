import type {
  CreateGameEventLogInput,
  GameEventLog,
  GameEventLogType,
  TeamSide,
  UpdateGameEventLogInput,
} from "../../../../entities/GameEventLog";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { Repository } from "./Repository";

export interface GameEventLogFilter {
  organization_id?: ScalarValueInput<GameEventLog["organization_id"]>;
  live_game_log_id?: ScalarValueInput<GameEventLog["live_game_log_id"]>;
  fixture_id?: ScalarValueInput<GameEventLog["fixture_id"]>;
  event_type?: GameEventLogType;
  team_side?: TeamSide;
  player_id?: ScalarValueInput<GameEventLog["player_id"]>;
  voided?: boolean;
}

export interface GameEventLogRepository extends Repository<
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
}
