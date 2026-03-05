import type {
  GameEventLog,
  CreateGameEventLogInput,
  UpdateGameEventLogInput,
  GameEventLogType,
  TeamSide,
} from "../../../../entities/GameEventLog";
import type { EntityListResult } from "../../../../entities/BaseEntity";
import type { AsyncResult } from "../../../../types/Result";
import type { Repository } from "./Repository";

export interface GameEventLogFilter {
  organization_id?: string;
  live_game_log_id?: string;
  fixture_id?: string;
  event_type?: GameEventLogType;
  team_side?: TeamSide;
  player_id?: string;
  voided?: boolean;
}

export interface GameEventLogRepository extends Repository<
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
}
