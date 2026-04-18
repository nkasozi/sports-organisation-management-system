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
import { build_game_event_type_not_found_by_code_error } from "../../core/interfaces/ports";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
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

const GLOBAL_GAME_EVENT_TYPE_SPORT_ID = "" as GameEventType["sport_id"];

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
    id: GameEventType["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameEventType {
    return { id, ...timestamps, ...input } as GameEventType;
  }

  protected apply_updates_to_entity(
    entity: GameEventType,
    updates: UpdateGameEventTypeInput,
  ): GameEventType {
    return { ...entity, ...updates } as GameEventType;
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
      if (filter && Object.keys(filter).length > 0) {
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
    sport_id: ScalarValueInput<NonNullable<GameEventType["sport_id"]>>,
  ): Promise<Result<GameEventType[]>> {
    try {
      const all = await this.database.game_event_types.toArray();
      return create_success_result(
        sort_game_event_types(
          all.filter(
            (event_type) =>
              event_type.sport_id === sport_id ||
              event_type.sport_id === GLOBAL_GAME_EVENT_TYPE_SPORT_ID,
          ),
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

  async find_by_code(code: string): Promise<Result<GameEventType>> {
    try {
      const all = await this.database.game_event_types.toArray();
      const found_event_type = all.find(
        (event_type) => event_type.code === code,
      );
      if (!found_event_type) {
        return create_failure_result(
          build_game_event_type_not_found_by_code_error(code),
        );
      }
      return create_success_result(found_event_type);
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
    organization_id: GameEventType["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameEventType> {
    return this.find_all({ organization_id }, options);
  }
}

type GameEventTypeRepositoryState =
  | { status: "uninitialized" }
  | { status: "ready"; repository: InBrowserGameEventTypeRepository };

let game_event_type_repository_state: GameEventTypeRepositoryState = {
  status: "uninitialized",
};

export function get_game_event_type_repository(): GameEventTypeRepository {
  if (game_event_type_repository_state.status === "ready") {
    return game_event_type_repository_state.repository;
  }

  const repository = new InBrowserGameEventTypeRepository();
  game_event_type_repository_state = { status: "ready", repository };

  return repository;
}

export async function reset_game_event_type_repository(): Promise<void> {
  const repository =
    get_game_event_type_repository() as InBrowserGameEventTypeRepository;
  await repository.clear_all_data();
}
