import type {
  CreateLiveGameLogInput,
  LiveGameLog,
  LiveGameStatus,
  UpdateLiveGameLogInput,
} from "../../../../entities/LiveGameLog";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { Repository } from "./Repository";

export interface LiveGameLogFilter {
  organization_id?: ScalarValueInput<LiveGameLog["organization_id"]>;
  fixture_id?: ScalarValueInput<LiveGameLog["fixture_id"]>;
  game_status?: LiveGameStatus;
  started_by_user_id?: ScalarValueInput<LiveGameLog["started_by_user_id"]>;
}

export interface LiveGameLogRepository extends Repository<
  LiveGameLog,
  CreateLiveGameLogInput,
  UpdateLiveGameLogInput,
  LiveGameLogFilter
> {
  get_live_game_log_for_fixture(
    fixture_id: ScalarValueInput<LiveGameLog["fixture_id"]>,
  ): AsyncResult<LiveGameLog>;

  get_active_games(
    organization_id?: ScalarValueInput<LiveGameLog["organization_id"]>,
  ): AsyncResult<LiveGameLog[]>;

  find_by_organization(
    organization_id: ScalarValueInput<LiveGameLog["organization_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<LiveGameLog>;

  find_completed_games(
    organization_id?: ScalarValueInput<LiveGameLog["organization_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<LiveGameLog>;
}
