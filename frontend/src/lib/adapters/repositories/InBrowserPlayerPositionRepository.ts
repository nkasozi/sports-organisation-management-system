import type { Table } from "dexie";
import type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
} from "../../core/entities/PlayerPosition";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { PlayerPositionRepository } from "../../core/interfaces/adapters/PlayerPositionRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "player_position";

export class InBrowserPlayerPositionRepository
  extends InBrowserBaseRepository<
    PlayerPosition,
    CreatePlayerPositionInput,
    UpdatePlayerPositionInput
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

  protected apply_updates_to_entity(
    entity: PlayerPosition,
    updates: UpdatePlayerPositionInput,
  ): PlayerPosition {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_code(code: string): Promise<PlayerPosition | null> {
    try {
      const all_positions = await this.database.player_positions.toArray();
      const found_position = all_positions.find(
        (position) => position.code.toLowerCase() === code.toLowerCase(),
      );
      return found_position ?? null;
    } catch {
      return null;
    }
  }

  async find_by_sport_type(sport_type: string): Promise<PlayerPosition[]> {
    try {
      const all_positions = await this.database.player_positions.toArray();
      return all_positions
        .filter((position) => position.sport_type === sport_type)
        .sort((a, b) => a.display_order - b.display_order);
    } catch {
      return [];
    }
  }

  async find_by_category(
    category: PlayerPosition["category"],
  ): Promise<PlayerPosition[]> {
    try {
      const all_positions = await this.database.player_positions.toArray();
      return all_positions
        .filter((position) => position.category === category)
        .sort((a, b) => a.display_order - b.display_order);
    } catch {
      return [];
    }
  }

  async find_available_positions(): Promise<PlayerPosition[]> {
    try {
      const all_positions = await this.database.player_positions.toArray();
      return all_positions
        .filter(
          (position) => position.is_available && position.status === "active",
        )
        .sort((a, b) => a.display_order - b.display_order);
    } catch {
      return [];
    }
  }

  async find_by_filter(
    filter: PlayerPositionFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition> {
    try {
      let filtered_entities = await this.database.player_positions.toArray();

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

      filtered_entities.sort((a, b) => a.display_order - b.display_order);

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter player positions: ${error_message}`,
      );
    }
  }
}

export function create_default_player_positions(): PlayerPosition[] {
  const now = new Date().toISOString();

  return [
    {
      id: "player_position_hockey_gk",
      name: "Goalkeeper",
      code: "GK",
      category: "goalkeeper",
      description: "Protects the goal and prevents scoring",
      sport_type: "Field Hockey",
      display_order: 1,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_sw",
      name: "Sweeper",
      code: "SW",
      category: "defender",
      description: "Last line of defense in front of goalkeeper",
      sport_type: "Field Hockey",
      display_order: 2,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_cb",
      name: "Center Back",
      code: "CB",
      category: "defender",
      description: "Central defensive position",
      sport_type: "Field Hockey",
      display_order: 3,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_lb",
      name: "Left Back",
      code: "LB",
      category: "defender",
      description: "Left side defensive position",
      sport_type: "Field Hockey",
      display_order: 4,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_rb",
      name: "Right Back",
      code: "RB",
      category: "defender",
      description: "Right side defensive position",
      sport_type: "Field Hockey",
      display_order: 5,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_cdm",
      name: "Defensive Midfielder",
      code: "CDM",
      category: "midfielder",
      description: "Central defensive midfield position",
      sport_type: "Field Hockey",
      display_order: 6,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_cm",
      name: "Center Midfielder",
      code: "CM",
      category: "midfielder",
      description: "Central midfield position",
      sport_type: "Field Hockey",
      display_order: 7,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_lm",
      name: "Left Midfielder",
      code: "LM",
      category: "midfielder",
      description: "Left side midfield position",
      sport_type: "Field Hockey",
      display_order: 8,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_rm",
      name: "Right Midfielder",
      code: "RM",
      category: "midfielder",
      description: "Right side midfield position",
      sport_type: "Field Hockey",
      display_order: 9,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_lw",
      name: "Left Wing",
      code: "LW",
      category: "forward",
      description: "Left attacking wing position",
      sport_type: "Field Hockey",
      display_order: 10,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_rw",
      name: "Right Wing",
      code: "RW",
      category: "forward",
      description: "Right attacking wing position",
      sport_type: "Field Hockey",
      display_order: 11,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_cf",
      name: "Center Forward",
      code: "CF",
      category: "forward",
      description: "Central attacking forward position",
      sport_type: "Field Hockey",
      display_order: 12,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_st",
      name: "Striker",
      code: "ST",
      category: "forward",
      description: "Main goal scoring position",
      sport_type: "Field Hockey",
      display_order: 13,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_position_hockey_if",
      name: "Inside Forward",
      code: "IF",
      category: "forward",
      description: "Inside attacking forward supporting strikers",
      sport_type: "Field Hockey",
      display_order: 14,
      is_available: true,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserPlayerPositionRepository | null = null;

export function get_player_position_repository(): PlayerPositionRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserPlayerPositionRepository();
  }
  return singleton_instance;
}

export async function initialize_player_position_repository(): Promise<void> {
  const repository =
    get_player_position_repository() as InBrowserPlayerPositionRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_player_positions());
  }
}

export async function reset_player_position_repository(): Promise<void> {
  const repository =
    get_player_position_repository() as InBrowserPlayerPositionRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_player_positions());
}
