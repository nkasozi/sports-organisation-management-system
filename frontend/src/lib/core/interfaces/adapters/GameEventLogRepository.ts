import type {
  GameEventLog,
  CreateGameEventLogInput,
  UpdateGameEventLogInput,
  GameEventLogType,
  TeamSide,
} from "../../entities/GameEventLog";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../../entities/BaseEntity";

export interface GameEventLogFilter {
  organization_id?: string;
  live_game_log_id?: string;
  fixture_id?: string;
  event_type?: GameEventLogType;
  team_side?: TeamSide;
  player_id?: string;
  voided?: boolean;
}

export interface GameEventLogRepository {
  create_game_event_log(
    input: CreateGameEventLogInput,
  ): Promise<EntityOperationResult<GameEventLog>>;

  get_game_event_log_by_id(
    id: string,
  ): Promise<EntityOperationResult<GameEventLog>>;

  update_game_event_log(
    id: string,
    input: UpdateGameEventLogInput,
  ): Promise<EntityOperationResult<GameEventLog>>;

  delete_game_event_log(id: string): Promise<EntityOperationResult<boolean>>;

  find_by_filter(
    filter?: GameEventLogFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>>;

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
  ): Promise<EntityOperationResult<GameEventLog>>;
}
