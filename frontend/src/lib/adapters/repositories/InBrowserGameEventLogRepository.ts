import type { Table } from "dexie";
import type {
  GameEventLog,
  CreateGameEventLogInput,
  UpdateGameEventLogInput,
} from "../../core/entities/GameEventLog";
import {
  is_scoring_event,
  is_card_event,
} from "../../core/entities/GameEventLog";
import type {
  BaseEntity,
  EntityListResult,
} from "../../core/entities/BaseEntity";
import type { AsyncResult } from "../../core/types/Result";
import type {
  GameEventLogRepository,
  GameEventLogFilter,
} from "../../core/interfaces/ports";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "gameevent";

class InBrowserGameEventLogRepository
  extends InBrowserBaseRepository<
    GameEventLog,
    CreateGameEventLogInput,
    UpdateGameEventLogInput,
    GameEventLogFilter
  >
  implements GameEventLogRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<GameEventLog, string> {
    return this.database.game_event_logs;
  }

  protected create_entity_from_input(
    input: CreateGameEventLogInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameEventLog {
    const now = new Date().toISOString();
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      live_game_log_id: input.live_game_log_id,
      fixture_id: input.fixture_id,
      event_type: input.event_type,
      minute: input.minute,
      stoppage_time_minute: input.stoppage_time_minute,
      team_side: input.team_side,
      player_id: input.player_id || "",
      player_name: input.player_name || "",
      secondary_player_id: input.secondary_player_id || "",
      secondary_player_name: input.secondary_player_name || "",
      description: input.description || "",
      affects_score: input.affects_score || false,
      score_change_home: input.score_change_home || 0,
      score_change_away: input.score_change_away || 0,
      recorded_by_user_id: input.recorded_by_user_id || "",
      recorded_at: now,
      reviewed: false,
      reviewed_by_user_id: "",
      reviewed_at: "",
      voided: false,
      voided_reason: "",
      status: input.status || "active",
    };
  }

  protected apply_updates_to_entity(
    entity: GameEventLog,
    updates: UpdateGameEventLogInput,
  ): GameEventLog {
    return {
      ...entity,
      ...updates,
    };
  }

  protected apply_entity_filter(
    entities: GameEventLog[],
    filter: GameEventLogFilter,
  ): GameEventLog[] {
    let filtered = entities;

    if (filter.organization_id) {
      filtered = filtered.filter(
        (event) => event.organization_id === filter.organization_id,
      );
    }

    if (filter.live_game_log_id) {
      filtered = filtered.filter(
        (event) => event.live_game_log_id === filter.live_game_log_id,
      );
    }

    if (filter.fixture_id) {
      filtered = filtered.filter(
        (event) => event.fixture_id === filter.fixture_id,
      );
    }

    if (filter.event_type) {
      filtered = filtered.filter(
        (event) => event.event_type === filter.event_type,
      );
    }

    if (filter.team_side) {
      filtered = filtered.filter(
        (event) => event.team_side === filter.team_side,
      );
    }

    if (filter.player_id) {
      filtered = filtered.filter(
        (event) =>
          event.player_id === filter.player_id ||
          event.secondary_player_id === filter.player_id,
      );
    }

    if (filter.voided !== undefined) {
      filtered = filtered.filter((event) => event.voided === filter.voided);
    }

    return filtered;
  }

  private async find_all_as_entity_list(
    filter?: GameEventLogFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>> {
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

  async get_events_for_live_game(
    live_game_log_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>> {
    return this.find_all_as_entity_list(
      { live_game_log_id, voided: false },
      options,
    );
  }

  async get_events_for_fixture(
    fixture_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>> {
    return this.find_all_as_entity_list({ fixture_id, voided: false }, options);
  }

  async get_events_for_player(
    player_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>> {
    return this.find_all_as_entity_list({ player_id, voided: false }, options);
  }

  async get_scoring_events_for_live_game(
    live_game_log_id: string,
  ): Promise<EntityListResult<GameEventLog>> {
    try {
      const result = await this.find_all_as_entity_list({
        live_game_log_id,
        voided: false,
      });

      if (!result.success) {
        return result;
      }

      const scoring_events = result.data.filter((event) =>
        is_scoring_event(event.event_type),
      );

      return {
        success: true,
        data: scoring_events,
        total_count: scoring_events.length,
      };
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        data: [],
        total_count: 0,
        error_message: `Failed to get scoring events: ${error_message}`,
      };
    }
  }

  async get_card_events_for_live_game(
    live_game_log_id: string,
  ): Promise<EntityListResult<GameEventLog>> {
    try {
      const result = await this.find_all_as_entity_list({
        live_game_log_id,
        voided: false,
      });

      if (!result.success) {
        return result;
      }

      const card_events = result.data.filter((event) =>
        is_card_event(event.event_type),
      );

      return {
        success: true,
        data: card_events,
        total_count: card_events.length,
      };
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        data: [],
        total_count: 0,
        error_message: `Failed to get card events: ${error_message}`,
      };
    }
  }

  async void_event(
    id: string,
    reason: string,
    voided_by_user_id: string,
  ): AsyncResult<GameEventLog> {
    const now = new Date().toISOString();
    return this.update(id, {
      voided: true,
      voided_reason: reason,
      reviewed: true,
      reviewed_by_user_id: voided_by_user_id,
      reviewed_at: now,
    });
  }
}

let singleton_instance: InBrowserGameEventLogRepository | null = null;

export function get_game_event_log_repository(): GameEventLogRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserGameEventLogRepository();
  }
  return singleton_instance;
}
