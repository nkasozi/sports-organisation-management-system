import type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
} from "../../core/interfaces/adapters/PlayerPositionRepository";
import type { AsyncResult } from "../../core/types/Result";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";
import { get_default_player_positions } from "../../core/entities/PlayerPosition";
import type { PlayerPositionRepository } from "../../core/interfaces/adapters/PlayerPositionRepository";

const STORAGE_KEY = "sports_org_player_positions";
const ENTITY_PREFIX = "player_position";

export class InMemoryPlayerPositionRepository
  extends InMemoryBaseRepository<
    PlayerPosition,
    CreatePlayerPositionInput,
    UpdatePlayerPositionInput
  >
  implements PlayerPositionRepository
{
  private seeded = false;

  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  private async seed_default_positions_if_needed(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;

    this.ensure_cache_initialized();

    if (this.entity_cache.size > 0) return;

    const default_positions = get_default_player_positions();
    for (const position_input of default_positions) {
      await this.create(position_input);
    }
  }

  protected create_entity_from_input(
    input: CreatePlayerPositionInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): PlayerPosition {
    return {
      id,
      ...timestamps,
      name: input.name,
      code: input.code,
      category: input.category,
      description: input.description,
      sport_type: input.sport_type,
      display_order: input.display_order,
      is_available: input.is_available,
      status: input.status,
    };
  }

  protected merge_updates(
    entity: PlayerPosition,
    updates: UpdatePlayerPositionInput,
  ): PlayerPosition {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_code(code: string): Promise<PlayerPosition | null> {
    await this.simulate_network_delay();
    await this.seed_default_positions_if_needed();

    for (const position of this.entity_cache.values()) {
      if (position.code.toLowerCase() === code.toLowerCase()) {
        return position;
      }
    }
    return null;
  }

  async find_by_sport_type(sport_type: string): Promise<PlayerPosition[]> {
    await this.simulate_network_delay();
    await this.seed_default_positions_if_needed();

    return Array.from(this.entity_cache.values())
      .filter((position) => position.sport_type === sport_type)
      .sort((a, b) => a.display_order - b.display_order);
  }

  async find_by_category(
    category: PlayerPosition["category"],
  ): Promise<PlayerPosition[]> {
    await this.simulate_network_delay();
    await this.seed_default_positions_if_needed();

    return Array.from(this.entity_cache.values())
      .filter((position) => position.category === category)
      .sort((a, b) => a.display_order - b.display_order);
  }

  async find_available_positions(): Promise<PlayerPosition[]> {
    await this.simulate_network_delay();
    await this.seed_default_positions_if_needed();

    return Array.from(this.entity_cache.values())
      .filter(
        (position) => position.is_available && position.status === "active",
      )
      .sort((a, b) => a.display_order - b.display_order);
  }

  protected apply_updates_to_entity(
    entity: PlayerPosition,
    updates: UpdatePlayerPositionInput,
  ): PlayerPosition {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_all_with_filter(
    filter?: PlayerPositionFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition> {
    await this.simulate_network_delay();
    await this.seed_default_positions_if_needed();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter) {
      if (filter.name_contains) {
        const search_term = filter.name_contains.toLowerCase();
        filtered_entities = filtered_entities.filter((position) =>
          position.name.toLowerCase().includes(search_term),
        );
      }

      if (filter.category) {
        filtered_entities = filtered_entities.filter(
          (position) => position.category === filter.category,
        );
      }

      if (filter.sport_type) {
        filtered_entities = filtered_entities.filter(
          (position) => position.sport_type === filter.sport_type,
        );
      }

      if (filter.is_available !== undefined) {
        filtered_entities = filtered_entities.filter(
          (position) => position.is_available === filter.is_available,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (position) => position.status === filter.status,
        );
      }
    }

    filtered_entities.sort((a, b) => a.display_order - b.display_order);

    const page_size = options?.page_size ?? 20;
    const page_number = options?.page_number ?? 1;
    const start_index = (page_number - 1) * page_size;
    const end_index = start_index + page_size;
    const paginated_items = filtered_entities.slice(start_index, end_index);

    return {
      success: true,
      data: {
        items: paginated_items,
        total_count: filtered_entities.length,
        page_number,
        page_size,
        total_pages: Math.ceil(filtered_entities.length / page_size),
      },
    };
  }

  async find_by_filter(
    filter: PlayerPositionFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition> {
    return this.find_all_with_filter(filter, options);
  }

  async find_by_id(id: string): AsyncResult<PlayerPosition> {
    await this.seed_default_positions_if_needed();
    return super.find_by_id(id);
  }

  async find_all(options?: QueryOptions): PaginatedAsyncResult<PlayerPosition> {
    await this.seed_default_positions_if_needed();
    return super.find_all(options);
  }

  reset(): void {
    this.entity_cache.clear();
    this.seeded = false;
  }
}

let repository_instance: InMemoryPlayerPositionRepository | null = null;

export function get_player_position_repository(): PlayerPositionRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryPlayerPositionRepository();
  }
  return repository_instance;
}

export function reset_player_position_repository(): void {
  if (repository_instance) {
    repository_instance.reset();
  }
  repository_instance = null;
}
