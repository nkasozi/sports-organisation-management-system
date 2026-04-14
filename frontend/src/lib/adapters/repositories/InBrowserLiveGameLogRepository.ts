import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateLiveGameLogInput,
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../../core/entities/LiveGameLog";
import { GAME_STATUS } from "../../core/entities/StatusConstants";
import type {
  LiveGameLogFilter,
  LiveGameLogRepository,
} from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
const ENTITY_PREFIX = "livegame";

class InBrowserLiveGameLogRepository
  extends InBrowserBaseRepository<
    LiveGameLog,
    CreateLiveGameLogInput,
    UpdateLiveGameLogInput,
    LiveGameLogFilter
  >
  implements LiveGameLogRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<LiveGameLog, string> {
    return this.database.live_game_logs;
  }

  protected create_entity_from_input(
    input: CreateLiveGameLogInput,
    id: LiveGameLog["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): LiveGameLog {
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      fixture_id: input.fixture_id,
      home_lineup_id: input.home_lineup_id || "",
      away_lineup_id: input.away_lineup_id || "",
      current_period: input.current_period || "pre_game",
      current_minute: 0,
      stoppage_time_minutes: 0,
      clock_running: false,
      clock_paused_at_seconds: 0,
      home_team_score: 0,
      away_team_score: 0,
      game_status: input.game_status || "pre_game",
      started_at: "",
      ended_at: "",
      started_by_user_id: input.started_by_user_id || "",
      ended_by_user_id: "",
      notes: input.notes || "",
      status: input.status || "active",
    } as LiveGameLog;
  }

  protected apply_updates_to_entity(
    entity: LiveGameLog,
    updates: UpdateLiveGameLogInput,
  ): LiveGameLog {
    const now = new Date().toISOString() as LiveGameLog["started_at"];
    let started_at = entity.started_at;
    let ended_at = entity.ended_at;

    if (
      updates.game_status === GAME_STATUS.IN_PROGRESS &&
      entity.game_status === "pre_game"
    ) {
      started_at = now;
    }

    if (
      (updates.game_status === GAME_STATUS.COMPLETED ||
        updates.game_status === "abandoned") &&
      entity.game_status !== GAME_STATUS.COMPLETED &&
      entity.game_status !== "abandoned"
    ) {
      ended_at = now;
    }

    return {
      ...entity,
      ...updates,
      started_at,
      ended_at,
    } as LiveGameLog;
  }

  protected apply_entity_filter(
    entities: LiveGameLog[],
    filter: LiveGameLogFilter,
  ): LiveGameLog[] {
    let filtered = entities;
    if (filter.organization_id) {
      filtered = filtered.filter(
        (l) => l.organization_id === filter.organization_id,
      );
    }
    if (filter.fixture_id) {
      filtered = filtered.filter((l) => l.fixture_id === filter.fixture_id);
    }
    if (filter.game_status) {
      filtered = filtered.filter((l) => l.game_status === filter.game_status);
    }
    if (filter.started_by_user_id) {
      filtered = filtered.filter(
        (l) => l.started_by_user_id === filter.started_by_user_id,
      );
    }
    return filtered;
  }

  private build_query_options(pagination?: {
    page: number;
    page_size: number;
  }) {
    return pagination
      ? { page_number: pagination.page, page_size: pagination.page_size }
      : undefined;
  }

  async get_live_game_log_for_fixture(
    fixture_id: LiveGameLog["fixture_id"],
  ): AsyncResult<LiveGameLog> {
    const result = await this.find_all({ fixture_id });
    if (!result.success) {
      return create_failure_result(result.error);
    }
    if (result.data.items.length === 0) {
      return create_failure_result("No live game log found for this fixture");
    }
    return create_success_result(result.data.items[0]);
  }

  async get_active_games(
    organization_id?: LiveGameLog["organization_id"],
  ): AsyncResult<LiveGameLog[]> {
    const filter: LiveGameLogFilter = organization_id
      ? { organization_id }
      : {};
    const result = await this.find_all(filter);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    const active_games = result.data.items
      .filter(
        (l) =>
          l.game_status === GAME_STATUS.IN_PROGRESS ||
          l.game_status === GAME_STATUS.PAUSED,
      )
      .sort(
        (a, b) =>
          new Date(b.started_at || b.created_at).getTime() -
          new Date(a.started_at || a.created_at).getTime(),
      );
    return { success: true, data: active_games };
  }

  async find_by_organization(
    organization_id: LiveGameLog["organization_id"],
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<LiveGameLog> {
    return this.find_all(
      { organization_id },
      this.build_query_options(options),
    );
  }

  async find_completed_games(
    organization_id?: string,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<LiveGameLog> {
    const filter: LiveGameLogFilter = { game_status: "completed" };
    if (organization_id) {
      filter.organization_id = organization_id;
    }
    return this.find_all(filter, this.build_query_options(options));
  }
}

let singleton_instance: InBrowserLiveGameLogRepository | null = null;

export function get_live_game_log_repository(): LiveGameLogRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserLiveGameLogRepository();
  }
  return singleton_instance;
}
