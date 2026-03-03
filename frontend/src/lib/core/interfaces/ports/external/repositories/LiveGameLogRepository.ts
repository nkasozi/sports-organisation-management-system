import type {
  LiveGameLog,
  CreateLiveGameLogInput,
  UpdateLiveGameLogInput,
  LiveGameStatus,
} from "../../../../entities/LiveGameLog";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../../../../entities/BaseEntity";

export interface LiveGameLogFilter {
  organization_id?: string;
  fixture_id?: string;
  game_status?: LiveGameStatus;
  started_by_user_id?: string;
}

export interface LiveGameLogRepository {
  create_live_game_log(
    input: CreateLiveGameLogInput,
  ): Promise<EntityOperationResult<LiveGameLog>>;

  get_live_game_log_by_id(
    id: string,
  ): Promise<EntityOperationResult<LiveGameLog>>;

  update_live_game_log(
    id: string,
    input: UpdateLiveGameLogInput,
  ): Promise<EntityOperationResult<LiveGameLog>>;

  delete_live_game_log(id: string): Promise<EntityOperationResult<boolean>>;

  find_by_filter(
    filter?: LiveGameLogFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<LiveGameLog>>;

  get_live_game_log_for_fixture(
    fixture_id: string,
  ): Promise<EntityOperationResult<LiveGameLog>>;

  get_active_games(
    organization_id?: string,
  ): Promise<EntityListResult<LiveGameLog>>;

  find_by_organization(
    organization_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<LiveGameLog>>;

  find_completed_games(
    organization_id?: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<LiveGameLog>>;
}
