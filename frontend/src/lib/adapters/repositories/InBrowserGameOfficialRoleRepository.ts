import type { Table } from "dexie";
import type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
} from "../../core/entities/GameOfficialRole";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  GameOfficialRoleRepository,
  GameOfficialRoleFilter,
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
import { get_default_football_official_roles_with_ids } from "../../core/entities/GameOfficialRole";

const ENTITY_PREFIX = "game_official_role";

export class InBrowserGameOfficialRoleRepository
  extends InBrowserBaseRepository<
    GameOfficialRole,
    CreateGameOfficialRoleInput,
    UpdateGameOfficialRoleInput,
    GameOfficialRoleFilter
  >
  implements GameOfficialRoleRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<GameOfficialRole, string> {
    return this.database.game_official_roles;
  }

  protected create_entity_from_input(
    input: CreateGameOfficialRoleInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameOfficialRole {
    return { id, ...timestamps, ...input };
  }

  protected apply_updates_to_entity(
    entity: GameOfficialRole,
    updates: UpdateGameOfficialRoleInput,
  ): GameOfficialRole {
    return { ...entity, ...updates };
  }

  protected apply_entity_filter(
    entities: GameOfficialRole[],
    filter: GameOfficialRoleFilter,
  ): GameOfficialRole[] {
    let filtered = entities;
    if (filter.name_contains) {
      const term = filter.name_contains.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(term));
    }
    if (filter.sport_id !== undefined) {
      filtered = filtered.filter((r) => r.sport_id === filter.sport_id);
    }
    if (filter.is_on_field !== undefined) {
      filtered = filtered.filter((r) => r.is_on_field === filter.is_on_field);
    }
    if (filter.is_head_official !== undefined) {
      filtered = filtered.filter(
        (r) => r.is_head_official === filter.is_head_official,
      );
    }
    if (filter.status) {
      filtered = filtered.filter((r) => r.status === filter.status);
    }
    if (filter.organization_id) {
      filtered = filtered.filter(
        (r) => r.organization_id === filter.organization_id,
      );
    }
    return filtered;
  }

  async find_all_with_filter(
    filter?: GameOfficialRoleFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameOfficialRole> {
    try {
      let filtered_entities = await this.database.game_official_roles.toArray();
      if (filter) {
        filtered_entities = this.apply_entity_filter(filtered_entities, filter);
      }
      filtered_entities.sort((a, b) => a.display_order - b.display_order);
      const total_count = filtered_entities.length;
      const paginated = this.apply_pagination(filtered_entities, options);
      return create_success_result(
        this.create_paginated_result(paginated, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter game official roles: ${error_message}`,
      );
    }
  }

  async find_by_sport(
    sport_id: string | null,
  ): Promise<Result<GameOfficialRole[]>> {
    try {
      const all = await this.database.game_official_roles.toArray();
      return create_success_result(
        all
          .filter((r) => r.sport_id === sport_id || r.sport_id === null)
          .sort((a, b) => a.display_order - b.display_order),
      );
    } catch (error) {
      console.error(
        "[InBrowserGameOfficialRoleRepository] find_by_sport error:",
        error,
      );
      return create_failure_result(`Failed to find roles by sport: ${error}`);
    }
  }

  async find_head_officials(): Promise<Result<GameOfficialRole[]>> {
    try {
      const all = await this.database.game_official_roles.toArray();
      return create_success_result(
        all
          .filter((r) => r.is_head_official)
          .sort((a, b) => a.display_order - b.display_order),
      );
    } catch (error) {
      console.error(
        "[InBrowserGameOfficialRoleRepository] find_head_officials error:",
        error,
      );
      return create_failure_result(`Failed to find head officials: ${error}`);
    }
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameOfficialRole> {
    return this.find_all({ organization_id }, options);
  }
}

export function create_default_game_official_roles_for_organization(
  organization_id: string,
): GameOfficialRole[] {
  return get_default_football_official_roles_with_ids(organization_id);
}

let singleton_instance: InBrowserGameOfficialRoleRepository | null = null;

export function get_game_official_role_repository(): GameOfficialRoleRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserGameOfficialRoleRepository();
  }
  return singleton_instance;
}

export async function reset_game_official_role_repository(): Promise<void> {
  const repository =
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository;
  await repository.clear_all_data();
}
