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

export class InBrowserGameEventLogRepository
  extends InBrowserBaseRepository<
    GameEventLog,
    CreateGameEventLogInput,
    UpdateGameEventLogInput
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

  async find_by_filter(
    filter?: GameEventLogFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>> {
    try {
      let filtered_entities = await this.database.game_event_logs.toArray();

      if (filter) {
        if (filter.organization_id) {
          filtered_entities = filtered_entities.filter(
            (event) => event.organization_id === filter.organization_id,
          );
        }

        if (filter.live_game_log_id) {
          filtered_entities = filtered_entities.filter(
            (event) => event.live_game_log_id === filter.live_game_log_id,
          );
        }

        if (filter.fixture_id) {
          filtered_entities = filtered_entities.filter(
            (event) => event.fixture_id === filter.fixture_id,
          );
        }

        if (filter.event_type) {
          filtered_entities = filtered_entities.filter(
            (event) => event.event_type === filter.event_type,
          );
        }

        if (filter.team_side) {
          filtered_entities = filtered_entities.filter(
            (event) => event.team_side === filter.team_side,
          );
        }

        if (filter.player_id) {
          filtered_entities = filtered_entities.filter(
            (event) =>
              event.player_id === filter.player_id ||
              event.secondary_player_id === filter.player_id,
          );
        }

        if (filter.voided !== undefined) {
          filtered_entities = filtered_entities.filter(
            (event) => event.voided === filter.voided,
          );
        }
      }

      filtered_entities.sort((first_entity, second_entity) => {
        const minute_diff = first_entity.minute - second_entity.minute;
        if (minute_diff !== 0) return minute_diff;
        return (
          new Date(first_entity.recorded_at).getTime() -
          new Date(second_entity.recorded_at).getTime()
        );
      });

      const total_count = filtered_entities.length;
      const page = pagination?.page || 1;
      const page_size = pagination?.page_size || 100;
      const start_index = (page - 1) * page_size;
      const end_index = start_index + page_size;
      const paginated_entities = filtered_entities.slice(
        start_index,
        end_index,
      );

      return {
        success: true,
        data: paginated_entities,
        total_count,
      };
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        data: [],
        total_count: 0,
        error_message: `Failed to filter game event logs: ${error_message}`,
      };
    }
  }

  async get_events_for_live_game(
    live_game_log_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>> {
    return this.find_by_filter({ live_game_log_id, voided: false }, options);
  }

  async get_events_for_fixture(
    fixture_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>> {
    return this.find_by_filter({ fixture_id, voided: false }, options);
  }

  async get_events_for_player(
    player_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<GameEventLog>> {
    return this.find_by_filter({ player_id, voided: false }, options);
  }

  async get_scoring_events_for_live_game(
    live_game_log_id: string,
  ): Promise<EntityListResult<GameEventLog>> {
    try {
      const result = await this.find_by_filter({
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
      const result = await this.find_by_filter({
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
    return this.update_game_event_log(id, {
      voided: true,
      voided_reason: reason,
      reviewed: true,
      reviewed_by_user_id: voided_by_user_id,
      reviewed_at: now,
    });
  }

  async create_game_event_log(
    input: CreateGameEventLogInput,
  ): AsyncResult<GameEventLog> {
    return this.create(input);
  }

  async get_game_event_log_by_id(id: string): AsyncResult<GameEventLog> {
    return this.find_by_id(id);
  }

  async update_game_event_log(
    id: string,
    input: UpdateGameEventLogInput,
  ): AsyncResult<GameEventLog> {
    return this.update(id, input);
  }

  async delete_game_event_log(id: string): AsyncResult<boolean> {
    return this.delete_by_id(id);
  }
}

export function create_default_game_event_logs(): GameEventLog[] {
  return [];
}

let singleton_instance: InBrowserGameEventLogRepository | null = null;

export function get_game_event_log_repository(): InBrowserGameEventLogRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserGameEventLogRepository();
  }
  return singleton_instance;
}
