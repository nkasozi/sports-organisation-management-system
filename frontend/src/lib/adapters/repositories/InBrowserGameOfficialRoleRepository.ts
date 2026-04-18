import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
  UpdateGameOfficialRoleInput,
} from "../../core/entities/GameOfficialRole";
import { get_default_football_official_roles_with_ids } from "../../core/entities/GameOfficialRole";
import type {
  GameOfficialRoleFilter,
  GameOfficialRoleRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { PaginatedAsyncResult, Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "game_official_role";
const GLOBAL_GAME_OFFICIAL_ROLE_SPORT_ID = "" as GameOfficialRole["sport_id"];

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
    id: GameOfficialRole["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameOfficialRole {
    return {
      id: id as GameOfficialRole["id"],
      ...timestamps,
      ...input,
    } as GameOfficialRole;
  }

  protected apply_updates_to_entity(
    entity: GameOfficialRole,
    updates: UpdateGameOfficialRoleInput,
  ): GameOfficialRole {
    return { ...entity, ...updates } as GameOfficialRole;
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
    if ("sport_id" in filter) {
      filtered = filtered.filter((r) => r.sport_id === filter.sport_id);
    }
    if ("is_on_field" in filter) {
      filtered = filtered.filter((r) => r.is_on_field === filter.is_on_field);
    }
    if ("is_head_official" in filter) {
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
      if (filter && Object.keys(filter).length > 0) {
        filtered_entities = this.apply_entity_filter(filtered_entities, filter);
      }
      filtered_entities.sort((a, b) => a.display_order - b.display_order);
      const total_count = filtered_entities.length;
      const paginated = this.apply_pagination(filtered_entities, options);
      return create_success_result(
        this.create_paginated_result(paginated, total_count, options),
      );
    } catch (error) {
      console.warn(
        "[GameOfficialRoleRepository] Failed to filter game official roles",
        {
          event: "repository_filter_game_official_roles_failed",
          error: String(error),
        },
      );
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter game official roles: ${error_message}`,
      );
    }
  }

  async find_by_sport(
    sport_id: GameOfficialRole["sport_id"],
  ): Promise<Result<GameOfficialRole[]>> {
    try {
      const all = await this.database.game_official_roles.toArray();
      return create_success_result(
        all
          .filter(
            (role) =>
              role.sport_id === sport_id ||
              role.sport_id === GLOBAL_GAME_OFFICIAL_ROLE_SPORT_ID,
          )
          .sort((a, b) => a.display_order - b.display_order),
      );
    } catch (error) {
      console.error("[GameOfficialRoleRepository] find_by_sport failed", {
        event: "repository_find_by_sport_failed",
        error: String(error),
      });
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
      console.error("[GameOfficialRoleRepository] find_head_officials failed", {
        event: "repository_find_head_officials_failed",
        error: String(error),
      });
      return create_failure_result(`Failed to find head officials: ${error}`);
    }
  }

  async find_by_organization(
    organization_id: GameOfficialRole["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameOfficialRole> {
    return this.find_all({ organization_id }, options);
  }
}

export function create_default_game_official_roles_for_organization(
  organization_id: ScalarValueInput<GameOfficialRole["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<GameOfficialRole>[] {
  return get_default_football_official_roles_with_ids(organization_id);
}

type GameOfficialRoleRepositoryState =
  | { status: "uninitialized" }
  | {
      status: "ready";
      repository: InBrowserGameOfficialRoleRepository;
    };

let game_official_role_repository_state: GameOfficialRoleRepositoryState = {
  status: "uninitialized",
};

export function get_game_official_role_repository(): GameOfficialRoleRepository {
  if (game_official_role_repository_state.status === "ready") {
    return game_official_role_repository_state.repository;
  }

  const repository = new InBrowserGameOfficialRoleRepository();
  game_official_role_repository_state = { status: "ready", repository };

  return repository;
}

export async function reset_game_official_role_repository(): Promise<void> {
  const repository =
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository;
  await repository.clear_all_data();
}
