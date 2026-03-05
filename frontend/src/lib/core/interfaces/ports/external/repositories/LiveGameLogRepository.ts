import type {
  LiveGameLog,
  CreateLiveGameLogInput,
  UpdateLiveGameLogInput,
  LiveGameStatus,
} from "../../../../entities/LiveGameLog";
import type { EntityListResult } from "../../../../entities/BaseEntity";
import type { AsyncResult } from "../../../../types/Result";
import type { Repository } from "./Repository";

export interface LiveGameLogFilter {
  organization_id?: string;
  fixture_id?: string;
  game_status?: LiveGameStatus;
  started_by_user_id?: string;
}

export interface LiveGameLogRepository extends Repository<
  LiveGameLog,
  CreateLiveGameLogInput,
  UpdateLiveGameLogInput,
  LiveGameLogFilter
> {
  get_live_game_log_for_fixture(fixture_id: string): AsyncResult<LiveGameLog>;

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
