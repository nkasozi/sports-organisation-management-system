import type {
  TeamStaffRoleRepository,
  TeamStaffRoleFilter,
} from "../../core/interfaces/adapters/TeamStaffRoleRepository";
import type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
} from "../../core/entities/TeamStaffRole";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";
import { get_default_team_staff_roles } from "../../core/entities/TeamStaffRole";

const STORAGE_KEY = "sports_org_team_staff_roles";
const ENTITY_PREFIX = "team_staff_role";

export class InMemoryTeamStaffRoleRepository
  extends InMemoryBaseRepository<
    TeamStaffRole,
    CreateTeamStaffRoleInput,
    UpdateTeamStaffRoleInput
  >
  implements TeamStaffRoleRepository
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

    const default_roles = get_default_team_staff_roles();
    for (const role_input of default_roles) {
      await this.create(role_input);
    }
  }

  protected create_entity_from_input(
    input: CreateTeamStaffRoleInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TeamStaffRole {
    return {
      id,
      ...timestamps,
      name: input.name,
      code: input.code,
      description: input.description,
      category: input.category,
      is_primary_contact: input.is_primary_contact,
      display_order: input.display_order,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: TeamStaffRole,
    updates: UpdateTeamStaffRoleInput,
  ): TeamStaffRole {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_all_with_filter(
    filter?: TeamStaffRoleFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamStaffRole> {
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

      if (filter.category) {
        filtered_entities = filtered_entities.filter(
          (role) => role.category === filter.category,
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

  async find_by_category(
    category: TeamStaffRole["category"],
  ): Promise<TeamStaffRole[]> {
    await this.simulate_network_delay();
    await this.seed_default_roles_if_needed();

    return Array.from(this.entity_cache.values())
      .filter((role) => role.category === category)
      .sort((a, b) => a.display_order - b.display_order);
  }
}

let team_staff_role_repository_instance: InMemoryTeamStaffRoleRepository | null =
  null;

export function get_team_staff_role_repository(): InMemoryTeamStaffRoleRepository {
  if (!team_staff_role_repository_instance) {
    team_staff_role_repository_instance = new InMemoryTeamStaffRoleRepository();
  }
  return team_staff_role_repository_instance;
}
