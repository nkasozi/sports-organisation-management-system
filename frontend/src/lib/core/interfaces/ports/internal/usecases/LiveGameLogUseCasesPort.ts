import type {
  CreateLiveGameLogInput,
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../../../../entities/LiveGameLog";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { LiveGameLogFilter } from "../../external/repositories/LiveGameLogRepository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface LiveGameLogUseCasesPort extends BaseUseCasesPort<
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

  start_game(
    id: ScalarValueInput<LiveGameLog["id"]>,
    user_id: ScalarValueInput<LiveGameLog["started_by_user_id"]>,
  ): AsyncResult<LiveGameLog>;

  pause_game(id: ScalarValueInput<LiveGameLog["id"]>): AsyncResult<LiveGameLog>;

  resume_game(
    id: ScalarValueInput<LiveGameLog["id"]>,
  ): AsyncResult<LiveGameLog>;

  end_game(
    id: ScalarValueInput<LiveGameLog["id"]>,
    user_id: ScalarValueInput<LiveGameLog["ended_by_user_id"]>,
  ): AsyncResult<LiveGameLog>;

  abandon_game(
    id: ScalarValueInput<LiveGameLog["id"]>,
    user_id: ScalarValueInput<LiveGameLog["ended_by_user_id"]>,
    reason: string,
  ): AsyncResult<LiveGameLog>;

  update_score(
    id: ScalarValueInput<LiveGameLog["id"]>,
    home_score: number,
    away_score: number,
  ): AsyncResult<LiveGameLog>;

  update_game_clock(
    id: ScalarValueInput<LiveGameLog["id"]>,
    current_minute: ScalarValueInput<LiveGameLog["current_minute"]>,
    stoppage_time_minutes?: ScalarValueInput<
      LiveGameLog["stoppage_time_minutes"]
    >,
  ): AsyncResult<LiveGameLog>;

  advance_period(
    id: ScalarValueInput<LiveGameLog["id"]>,
    new_period: LiveGameLog["current_period"],
  ): AsyncResult<LiveGameLog>;

  list_by_organization(
    organization_id: ScalarValueInput<LiveGameLog["organization_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<LiveGameLog>;

  list_completed_games(
    organization_id?: ScalarValueInput<LiveGameLog["organization_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<LiveGameLog>;
}
