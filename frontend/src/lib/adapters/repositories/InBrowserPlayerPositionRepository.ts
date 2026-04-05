import type { Table } from "dexie";
import type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
} from "../../core/entities/PlayerPosition";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  PlayerPositionRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type {
  PaginatedAsyncResult,
  AsyncResult,
  Result,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
export { create_default_player_positions_for_organization } from "./InBrowserPlayerPositionRepositoryDefaults";

const ENTITY_PREFIX = "player_position";

export class InBrowserPlayerPositionRepository
  extends InBrowserBaseRepository<
    PlayerPosition,
    CreatePlayerPositionInput,
    UpdatePlayerPositionInput,
    PlayerPositionFilter
  >
  implements PlayerPositionRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<PlayerPosition, string> {
    return this.database.player_positions;
  }

  protected create_entity_from_input(
    input: CreatePlayerPositionInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): PlayerPosition {
    return { id, ...timestamps, ...input };
  }

  protected apply_updates_to_entity(
    entity: PlayerPosition,
    updates: UpdatePlayerPositionInput,
  ): PlayerPosition {
    return { ...entity, ...updates };
  }

  protected apply_entity_filter(
    entities: PlayerPosition[],
    filter: PlayerPositionFilter,
  ): PlayerPosition[] {
    let filtered = entities;
    if (filter.name_contains) {
      const term = filter.name_contains.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
    }
    if (filter.category) {
      filtered = filtered.filter((p) => p.category === filter.category);
    }
    if (filter.sport_type) {
      filtered = filtered.filter((p) => p.sport_type === filter.sport_type);
    }
    if (filter.is_available !== undefined) {
      filtered = filtered.filter((p) => p.is_available === filter.is_available);
    }
    if (filter.status) {
      filtered = filtered.filter((p) => p.status === filter.status);
    }
    if (filter.organization_id) {
      filtered = filtered.filter(
        (p) => p.organization_id === filter.organization_id,
      );
    }
    return filtered;
  }

  async find_by_code(code: string): Promise<Result<PlayerPosition | null>> {
    try {
      const all = await this.database.player_positions.toArray();
      return create_success_result(
        all.find((p) => p.code.toLowerCase() === code.toLowerCase()) ?? null,
      );
    } catch (error) {
      return create_failure_result(`Failed to find position by code: ${error}`);
    }
  }

  async find_by_sport_type(
    sport_type: string,
  ): Promise<Result<PlayerPosition[]>> {
    try {
      const all = await this.database.player_positions.toArray();
      return create_success_result(
        all
          .filter((p) => p.sport_type === sport_type)
          .sort((a, b) => a.display_order - b.display_order),
      );
    } catch (error) {
      return create_failure_result(
        `Failed to find positions by sport type: ${error}`,
      );
    }
  }

  async find_by_category(
    category: PlayerPosition["category"],
  ): Promise<Result<PlayerPosition[]>> {
    try {
      const all = await this.database.player_positions.toArray();
      return create_success_result(
        all
          .filter((p) => p.category === category)
          .sort((a, b) => a.display_order - b.display_order),
      );
    } catch (error) {
      return create_failure_result(
        `Failed to find positions by category: ${error}`,
      );
    }
  }

  async find_available_positions(): Promise<Result<PlayerPosition[]>> {
    try {
      const all = await this.database.player_positions.toArray();
      return create_success_result(
        all
          .filter((p) => p.is_available && p.status === "active")
          .sort((a, b) => a.display_order - b.display_order),
      );
    } catch (error) {
      return create_failure_result(
        `Failed to find available positions: ${error}`,
      );
    }
  }

  async find_by_filter(
    filter: PlayerPositionFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition> {
    try {
      let filtered_entities = await this.database.player_positions.toArray();
      filtered_entities = this.apply_entity_filter(filtered_entities, filter);
      filtered_entities.sort((a, b) => a.display_order - b.display_order);
      const total_count = filtered_entities.length;
      const sorted = this.apply_sort(filtered_entities, options);
      const paginated = this.apply_pagination(sorted, options);
      return create_success_result(
        this.create_paginated_result(paginated, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter player positions: ${error_message}`,
      );
    }
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition> {
    return this.find_all({ organization_id }, options);
  }
}

let singleton_instance: InBrowserPlayerPositionRepository | null = null;

export function get_player_position_repository(): PlayerPositionRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserPlayerPositionRepository();
  }
  return singleton_instance;
}

export async function reset_player_position_repository(): Promise<void> {
  const repository =
    get_player_position_repository() as InBrowserPlayerPositionRepository;
  await repository.clear_all_data();
}
