import type { Table } from "dexie";
import type {
  LiveGameLog,
  CreateLiveGameLogInput,
  UpdateLiveGameLogInput,
} from "../../core/entities/LiveGameLog";
import type {
  BaseEntity,
  EntityListResult,
} from "../../core/entities/BaseEntity";
import type { AsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import type {
  LiveGameLogRepository,
  LiveGameLogFilter,
} from "../../core/interfaces/ports";
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
    id: string,
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
    };
  }

  protected apply_updates_to_entity(
    entity: LiveGameLog,
    updates: UpdateLiveGameLogInput,
  ): LiveGameLog {
    const now = new Date().toISOString();
    let started_at = entity.started_at;
    let ended_at = entity.ended_at;

    if (
      updates.game_status === "in_progress" &&
      entity.game_status === "pre_game"
    ) {
      started_at = now;
    }

    if (
      (updates.game_status === "completed" ||
        updates.game_status === "abandoned") &&
      entity.game_status !== "completed" &&
      entity.game_status !== "abandoned"
    ) {
      ended_at = now;
    }

    return {
      ...entity,
      ...updates,
      started_at,
      ended_at,
    };
  }

  protected apply_entity_filter(
    entities: LiveGameLog[],
    filter: LiveGameLogFilter,
  ): LiveGameLog[] {
    let filtered = entities;

    if (filter.organization_id) {
      filtered = filtered.filter(
        (log) => log.organization_id === filter.organization_id,
      );
    }

    if (filter.fixture_id) {
      filtered = filtered.filter((log) => log.fixture_id === filter.fixture_id);
    }

    if (filter.game_status) {
      filtered = filtered.filter(
        (log) => log.game_status === filter.game_status,
      );
    }

    if (filter.started_by_user_id) {
      filtered = filtered.filter(
        (log) => log.started_by_user_id === filter.started_by_user_id,
      );
    }

    return filtered;
  }

  private async find_all_as_entity_list(
    filter?: LiveGameLogFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<LiveGameLog>> {
    const query_options = pagination
      ? { page_number: pagination.page, page_size: pagination.page_size }
      : undefined;
    const result = await this.find_all(filter, query_options);
    if (!result.success) {
      return {
        success: false,
        data: [],
        total_count: 0,
        error_message: result.error,
      };
    }
    return {
      success: true,
      data: result.data.items,
      total_count: result.data.total_count,
    };
  }

  async get_live_game_log_for_fixture(
    fixture_id: string,
  ): AsyncResult<LiveGameLog> {
    try {
      const result = await this.find_all_as_entity_list({ fixture_id });

      if (!result.success || result.data.length === 0) {
        return create_failure_result("No live game log found for this fixture");
      }

      return create_success_result(result.data[0]);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to get live game log for fixture: ${error_message}`,
      );
    }
  }

  async get_active_games(
    organization_id?: string,
  ): Promise<EntityListResult<LiveGameLog>> {
    try {
      let filtered_entities = await this.database.live_game_logs.toArray();

      filtered_entities = filtered_entities.filter(
        (log) =>
          log.game_status === "in_progress" || log.game_status === "paused",
      );

      if (organization_id) {
        filtered_entities = filtered_entities.filter(
          (log) => log.organization_id === organization_id,
        );
      }

      filtered_entities.sort(
        (first_entity, second_entity) =>
          new Date(
            second_entity.started_at || second_entity.created_at,
          ).getTime() -
          new Date(
            first_entity.started_at || first_entity.created_at,
          ).getTime(),
      );

      return {
        success: true,
        data: filtered_entities,
        total_count: filtered_entities.length,
      };
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        data: [],
        total_count: 0,
        error_message: `Failed to get active games: ${error_message}`,
      };
    }
  }

  async find_by_organization(
    organization_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<LiveGameLog>> {
    return this.find_all_as_entity_list({ organization_id }, options);
  }

  async find_completed_games(
    organization_id?: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<LiveGameLog>> {
    return this.find_all_as_entity_list(
      {
        organization_id,
        game_status: "completed",
      },
      options,
    );
  }
}

let singleton_instance: InBrowserLiveGameLogRepository | null = null;

export function get_live_game_log_repository(): LiveGameLogRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserLiveGameLogRepository();
  }
  return singleton_instance;
}
