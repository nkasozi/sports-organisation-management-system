import type { Table } from "dexie";
import type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  EventCategory,
} from "../../core/entities/GameEventType";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  GameEventTypeRepository,
  GameEventTypeFilter,
} from "../../core/interfaces/adapters/GameEventTypeRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { get_default_game_event_types } from "../../core/entities/GameEventType";

const ENTITY_PREFIX = "game_event_type";

export class InBrowserGameEventTypeRepository
  extends InBrowserBaseRepository<
    GameEventType,
    CreateGameEventTypeInput,
    UpdateGameEventTypeInput
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
    return {
      id,
      ...timestamps,
      name: input.name,
      code: input.code,
      description: input.description,
      icon: input.icon,
      color: input.color,
      category: input.category,
      affects_score: input.affects_score,
      requires_player: input.requires_player,
      display_order: input.display_order,
      sport_id: input.sport_id,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: GameEventType,
    updates: UpdateGameEventTypeInput,
  ): GameEventType {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_all_with_filter(
    filter?: GameEventTypeFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameEventType> {
    try {
      let filtered_entities = await this.database.game_event_types.toArray();

      if (filter) {
        if (filter.name_contains) {
          const search_term = filter.name_contains.toLowerCase();
          filtered_entities = filtered_entities.filter((event_type) =>
            event_type.name.toLowerCase().includes(search_term),
          );
        }

        if (filter.code) {
          filtered_entities = filtered_entities.filter(
            (event_type) => event_type.code === filter.code,
          );
        }

        if (filter.sport_id !== undefined) {
          filtered_entities = filtered_entities.filter(
            (event_type) =>
              event_type.sport_id === filter.sport_id ||
              event_type.sport_id === null,
          );
        }

        if (filter.category) {
          filtered_entities = filtered_entities.filter(
            (event_type) => event_type.category === filter.category,
          );
        }

        if (filter.affects_score !== undefined) {
          filtered_entities = filtered_entities.filter(
            (event_type) => event_type.affects_score === filter.affects_score,
          );
        }

        if (filter.requires_player !== undefined) {
          filtered_entities = filtered_entities.filter(
            (event_type) =>
              event_type.requires_player === filter.requires_player,
          );
        }

        if (filter.status) {
          filtered_entities = filtered_entities.filter(
            (event_type) => event_type.status === filter.status,
          );
        }
      }

      filtered_entities.sort((a, b) => a.display_order - b.display_order);

      const total_count = filtered_entities.length;
      const paginated_entities = this.apply_pagination(
        filtered_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter game event types: ${error_message}`,
      );
    }
  }

  async find_by_sport(sport_id: string | null): Promise<GameEventType[]> {
    try {
      const all_event_types = await this.database.game_event_types.toArray();
      return all_event_types
        .filter(
          (event_type) =>
            event_type.sport_id === sport_id || event_type.sport_id === null,
        )
        .sort((a, b) => a.display_order - b.display_order);
    } catch {
      return [];
    }
  }

  async find_by_category(category: EventCategory): Promise<GameEventType[]> {
    try {
      const all_event_types = await this.database.game_event_types.toArray();
      return all_event_types
        .filter((event_type) => event_type.category === category)
        .sort((a, b) => a.display_order - b.display_order);
    } catch {
      return [];
    }
  }

  async find_by_code(code: string): Promise<GameEventType | null> {
    try {
      const all_event_types = await this.database.game_event_types.toArray();
      return (
        all_event_types.find((event_type) => event_type.code === code) ?? null
      );
    } catch {
      return null;
    }
  }

  async find_scoring_events(): Promise<GameEventType[]> {
    try {
      const all_event_types = await this.database.game_event_types.toArray();
      return all_event_types
        .filter((event_type) => event_type.affects_score)
        .sort((a, b) => a.display_order - b.display_order);
    } catch {
      return [];
    }
  }
}

export function create_default_game_event_types(): GameEventType[] {
  const now = new Date().toISOString();
  const default_inputs = get_default_game_event_types();

  return default_inputs.map((input, index) => ({
    id: `game_event_type_default_${index + 1}`,
    created_at: now,
    updated_at: now,
    name: input.name,
    code: input.code,
    description: input.description,
    icon: input.icon,
    color: input.color,
    category: input.category,
    affects_score: input.affects_score,
    requires_player: input.requires_player,
    display_order: input.display_order,
    sport_id: input.sport_id,
    status: input.status,
  }));
}

let singleton_instance: InBrowserGameEventTypeRepository | null = null;

export function get_game_event_type_repository(): GameEventTypeRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserGameEventTypeRepository();
  }
  return singleton_instance;
}

export async function initialize_game_event_type_repository(): Promise<void> {
  const repository =
    get_game_event_type_repository() as InBrowserGameEventTypeRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_game_event_types());
  }
}

export async function reset_game_event_type_repository(): Promise<void> {
  const repository =
    get_game_event_type_repository() as InBrowserGameEventTypeRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_game_event_types());
}
