import type {
  GameEventTypeRepository,
  GameEventTypeFilter,
} from "../../core/interfaces/adapters/GameEventTypeRepository";
import type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  EventCategory,
} from "../../core/entities/GameEventType";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";
import { get_default_game_event_types } from "../../core/entities/GameEventType";

const STORAGE_KEY = "sports_org_game_event_types";
const ENTITY_PREFIX = "game_event_type";

export class InMemoryGameEventTypeRepository
  extends InMemoryBaseRepository<
    GameEventType,
    CreateGameEventTypeInput,
    UpdateGameEventTypeInput
  >
  implements GameEventTypeRepository
{
  private seeded = false;

  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  private async seed_default_event_types_if_needed(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;

    await this.ensure_cache_initialized();

    if (this.entity_cache.size > 0) return;

    const default_types = get_default_game_event_types();
    for (const type_input of default_types) {
      await this.create(type_input);
    }
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
    await this.simulate_network_delay();
    await this.seed_default_event_types_if_needed();

    let filtered_entities = Array.from(this.entity_cache.values());

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
          (event_type) => event_type.requires_player === filter.requires_player,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (event_type) => event_type.status === filter.status,
        );
      }
    }

    filtered_entities.sort((a, b) => a.display_order - b.display_order);

    const page_number = options?.page_number ?? 1;
    const page_size = options?.page_size ?? 100;
    const total_count = filtered_entities.length;
    const total_pages = Math.ceil(total_count / page_size);
    const start_index = (page_number - 1) * page_size;
    const items = filtered_entities.slice(start_index, start_index + page_size);

    return create_success_result({
      items,
      total_count,
      page_number,
      page_size,
      total_pages,
    });
  }

  async find_by_sport(sport_id: string | null): Promise<GameEventType[]> {
    await this.simulate_network_delay();
    await this.seed_default_event_types_if_needed();

    return Array.from(this.entity_cache.values())
      .filter(
        (event_type) =>
          event_type.sport_id === sport_id || event_type.sport_id === null,
      )
      .sort((a, b) => a.display_order - b.display_order);
  }

  async find_by_category(category: EventCategory): Promise<GameEventType[]> {
    await this.simulate_network_delay();
    await this.seed_default_event_types_if_needed();

    return Array.from(this.entity_cache.values())
      .filter((event_type) => event_type.category === category)
      .sort((a, b) => a.display_order - b.display_order);
  }

  async find_by_code(code: string): Promise<GameEventType | null> {
    await this.simulate_network_delay();
    await this.seed_default_event_types_if_needed();

    return (
      Array.from(this.entity_cache.values()).find(
        (event_type) => event_type.code === code,
      ) ?? null
    );
  }

  async find_scoring_events(): Promise<GameEventType[]> {
    await this.simulate_network_delay();
    await this.seed_default_event_types_if_needed();

    return Array.from(this.entity_cache.values())
      .filter((event_type) => event_type.affects_score)
      .sort((a, b) => a.display_order - b.display_order);
  }
}

let repository_instance: InMemoryGameEventTypeRepository | null = null;

export function get_game_event_type_repository(): InMemoryGameEventTypeRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryGameEventTypeRepository();
  }
  return repository_instance;
}

export function reset_game_event_type_repository(): void {
  repository_instance = null;
}
