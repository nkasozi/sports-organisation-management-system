import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateGameEventTypeInput,
  EventCategory,
  GameEventType,
  UpdateGameEventTypeInput,
} from "../../core/entities/GameEventType";
import type {
  GameEventTypeFilter,
  GameEventTypeRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type { PaginatedAsyncResult, Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_game_event_type_filter,
  sort_game_event_types,
} from "./InBrowserGameEventTypeRepositoryHelpers";
export { create_default_game_event_types_for_organization } from "./InBrowserGameEventTypeRepositoryDefaults";

const ENTITY_PREFIX = "game_event_type";

export class InBrowserGameEventTypeRepository
  extends InBrowserBaseRepository<
    GameEventType,
    CreateGameEventTypeInput,
    UpdateGameEventTypeInput,
    GameEventTypeFilter
  >
  implements GameEventTypeRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<GameEventType, string> {
    return this.database.game_event_types;
  }

  protected create_entity_from_input(
    input: CreateGameEventTypeInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameEventType {
    return { id, ...timestamps, ...input };
  }

  protected apply_updates_to_entity(
    entity: GameEventType,
    updates: UpdateGameEventTypeInput,
  ): GameEventType {
    return { ...entity, ...updates };
  }

  protected apply_entity_filter(
    entities: GameEventType[],
    filter: GameEventTypeFilter,
  ): GameEventType[] {
    return apply_game_event_type_filter(entities, filter);
  }

  async find_all_with_filter(
    filter?: GameEventTypeFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameEventType> {
    try {
      let filtered_entities = await this.database.game_event_types.toArray();
      if (filter) {
        filtered_entities = this.apply_entity_filter(filtered_entities, filter);
      }
      filtered_entities = sort_game_event_types(filtered_entities);
      const total_count = filtered_entities.length;
      const paginated = this.apply_pagination(filtered_entities, options);
      return create_success_result(
        this.create_paginated_result(paginated, total_count, options),
      );
    } catch (error) {
      console.warn(
        "[GameEventTypeRepository] Failed to filter game event types",
        {
          event: "repository_filter_game_event_types_failed",
          error: String(error),
        },
      );
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter game event types: ${error_message}`,
      );
    }
  }

  async find_by_sport(
    sport_id: string | null,
  ): Promise<Result<GameEventType[]>> {
    try {
      const all = await this.database.game_event_types.toArray();
      return create_success_result(
        sort_game_event_types(
          all.filter((e) => e.sport_id === sport_id || e.sport_id === null),
        ),
      );
    } catch (error) {
      console.warn(
        "[GameEventTypeRepository] Failed to find event types by sport",
        {
          event: "repository_find_event_types_by_sport_failed",
          error: String(error),
        },
      );
      return create_failure_result(
        `Failed to find event types by sport: ${error}`,
      );
    }
  }

  async find_by_category(
    category: EventCategory,
  ): Promise<Result<GameEventType[]>> {
    try {
      const all = await this.database.game_event_types.toArray();
      return create_success_result(
        sort_game_event_types(all.filter((e) => e.category === category)),
      );
    } catch (error) {
      console.warn(
        "[GameEventTypeRepository] Failed to find event types by category",
        {
          event: "repository_find_event_types_by_category_failed",
          error: String(error),
        },
      );
      return create_failure_result(
        `Failed to find event types by category: ${error}`,
      );
    }
  }

  async find_by_code(code: string): Promise<Result<GameEventType | null>> {
    try {
      const all = await this.database.game_event_types.toArray();
      return create_success_result(all.find((e) => e.code === code) ?? null);
    } catch (error) {
      console.warn(
        "[GameEventTypeRepository] Failed to find event type by code",
        {
          event: "repository_find_event_type_by_code_failed",
          error: String(error),
        },
      );
      return create_failure_result(
        `Failed to find event type by code: ${error}`,
      );
    }
  }
  async find_scoring_events(): Promise<Result<GameEventType[]>> {
    try {
      const all = await this.database.game_event_types.toArray();
      return create_success_result(
        sort_game_event_types(all.filter((e) => e.affects_score)),
      );
    } catch (error) {
      console.warn("[GameEventTypeRepository] Failed to find scoring events", {
        event: "repository_find_scoring_events_failed",
        error: String(error),
      });
      return create_failure_result(`Failed to find scoring events: ${error}`);
    }
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameEventType> {
    return this.find_all({ organization_id }, options);
  }
}

let singleton_instance: InBrowserGameEventTypeRepository | null = null;

export function get_game_event_type_repository(): GameEventTypeRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserGameEventTypeRepository();
  }
  return singleton_instance;
}

export async function reset_game_event_type_repository(): Promise<void> {
  const repository =
    get_game_event_type_repository() as InBrowserGameEventTypeRepository;
  await repository.clear_all_data();
}
