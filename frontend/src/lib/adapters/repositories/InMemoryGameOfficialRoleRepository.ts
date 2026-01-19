import type {
  GameOfficialRoleRepository,
  GameOfficialRoleFilter,
} from "../../core/interfaces/adapters/GameOfficialRoleRepository";
import type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
} from "../../core/entities/GameOfficialRole";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";
import { get_default_football_official_roles } from "../../core/entities/GameOfficialRole";

const STORAGE_KEY = "sports_org_game_official_roles";
const ENTITY_PREFIX = "game_official_role";

export class InMemoryGameOfficialRoleRepository
  extends InMemoryBaseRepository<
    GameOfficialRole,
    CreateGameOfficialRoleInput,
    UpdateGameOfficialRoleInput
  >
  implements GameOfficialRoleRepository
{
  private seeded = false;

  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  private async seed_default_roles_if_needed(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;

    await this.ensure_cache_initialized();

    if (this.entity_cache.size > 0) return;

    const default_roles = get_default_football_official_roles();
    for (const role_input of default_roles) {
      await this.create(role_input);
    }
  }

  protected create_entity_from_input(
    input: CreateGameOfficialRoleInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameOfficialRole {
    return {
      id,
      ...timestamps,
      name: input.name,
      code: input.code,
      description: input.description,
      sport_id: input.sport_id,
      is_on_field: input.is_on_field,
      is_head_official: input.is_head_official,
      display_order: input.display_order,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: GameOfficialRole,
    updates: UpdateGameOfficialRoleInput,
  ): GameOfficialRole {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_all_with_filter(
    filter?: GameOfficialRoleFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameOfficialRole> {
    await this.simulate_network_delay();
    await this.seed_default_roles_if_needed();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter) {
      if (filter.name_contains) {
        const search_term = filter.name_contains.toLowerCase();
        filtered_entities = filtered_entities.filter((role) =>
          role.name.toLowerCase().includes(search_term),
        );
      }

      if (filter.sport_id !== undefined) {
        filtered_entities = filtered_entities.filter(
          (role) => role.sport_id === filter.sport_id,
        );
      }

      if (filter.is_on_field !== undefined) {
        filtered_entities = filtered_entities.filter(
          (role) => role.is_on_field === filter.is_on_field,
        );
      }

      if (filter.is_head_official !== undefined) {
        filtered_entities = filtered_entities.filter(
          (role) => role.is_head_official === filter.is_head_official,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (role) => role.status === filter.status,
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

  async find_by_sport(sport_id: string | null): Promise<GameOfficialRole[]> {
    await this.simulate_network_delay();
    await this.seed_default_roles_if_needed();

    return Array.from(this.entity_cache.values())
      .filter((role) => role.sport_id === sport_id || role.sport_id === null)
      .sort((a, b) => a.display_order - b.display_order);
  }

  async find_head_officials(): Promise<GameOfficialRole[]> {
    await this.simulate_network_delay();
    await this.seed_default_roles_if_needed();

    return Array.from(this.entity_cache.values())
      .filter((role) => role.is_head_official)
      .sort((a, b) => a.display_order - b.display_order);
  }
}

let repository_instance: InMemoryGameOfficialRoleRepository | null = null;

export function get_game_official_role_repository(): InMemoryGameOfficialRoleRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryGameOfficialRoleRepository();
  }
  return repository_instance;
}
