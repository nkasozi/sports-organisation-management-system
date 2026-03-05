import type {
  LiveGameLog,
  CreateLiveGameLogInput,
  UpdateLiveGameLogInput,
} from "../../../../entities/LiveGameLog";
import type { LiveGameLogFilter } from "../../external/repositories/LiveGameLogRepository";
import type { EntityListResult } from "../../../../entities/BaseEntity";
import type { AsyncResult } from "../../../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface LiveGameLogUseCasesPort extends BaseUseCasesPort<
  LiveGameLog,
  CreateLiveGameLogInput,
  UpdateLiveGameLogInput,
  LiveGameLogFilter
> {
  get_live_game_log_for_fixture(fixture_id: string): AsyncResult<LiveGameLog>;

  get_active_games(
    organization_id?: string,
  ): Promise<EntityListResult<LiveGameLog>>;

  start_game(id: string, user_id: string): AsyncResult<LiveGameLog>;

  pause_game(id: string): AsyncResult<LiveGameLog>;

  resume_game(id: string): AsyncResult<LiveGameLog>;

  end_game(id: string, user_id: string): AsyncResult<LiveGameLog>;

  abandon_game(
    id: string,
    user_id: string,
    reason: string,
  ): AsyncResult<LiveGameLog>;

  update_score(
    id: string,
    home_score: number,
    away_score: number,
  ): AsyncResult<LiveGameLog>;

  update_game_clock(
    id: string,
    current_minute: number,
    stoppage_time_minutes?: number,
  ): AsyncResult<LiveGameLog>;

  advance_period(id: string, new_period: string): AsyncResult<LiveGameLog>;

  list_by_organization(
    organization_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<LiveGameLog>>;

  list_completed_games(
    organization_id?: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<LiveGameLog>>;
}
