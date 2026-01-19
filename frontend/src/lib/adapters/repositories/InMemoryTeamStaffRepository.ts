import type {
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
} from "../../core/entities/TeamStaff";
import { DEFAULT_STAFF_AVATAR } from "../../core/entities/TeamStaff";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  TeamStaffRepository,
  TeamStaffFilter,
} from "../../core/interfaces/adapters/TeamStaffRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type {
  PaginatedAsyncResult,
  AsyncResult,
} from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_team_staff";
const ENTITY_PREFIX = "team_staff";

export class InMemoryTeamStaffRepository
  extends InMemoryBaseRepository<
    TeamStaff,
    CreateTeamStaffInput,
    UpdateTeamStaffInput
  >
  implements TeamStaffRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateTeamStaffInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TeamStaff {
    return {
      id,
      ...timestamps,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.date_of_birth,
      team_id: input.team_id,
      role_id: input.role_id,
      nationality: input.nationality || "",
      profile_image_url: input.profile_image_url || DEFAULT_STAFF_AVATAR,
      employment_start_date: input.employment_start_date,
      employment_end_date: input.employment_end_date,
      emergency_contact_name: input.emergency_contact_name || "",
      emergency_contact_phone: input.emergency_contact_phone || "",
      notes: input.notes || "",
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: TeamStaff,
    updates: UpdateTeamStaffInput,
  ): TeamStaff {
    return {
      ...entity,
      ...updates,
      profile_image_url: updates.profile_image_url ?? entity.profile_image_url,
    };
  }

  async find_all_with_filter(
    filter?: TeamStaffFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamStaff> {
    await this.simulate_network_delay();
    await this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter) {
      if (filter.name_contains) {
        const search_term = filter.name_contains.toLowerCase();
        filtered_entities = filtered_entities.filter((staff) =>
          `${staff.first_name} ${staff.last_name}`
            .toLowerCase()
            .includes(search_term),
        );
      }

      if (filter.team_id) {
        filtered_entities = filtered_entities.filter(
          (staff) => staff.team_id === filter.team_id,
        );
      }

      if (filter.role_id) {
        filtered_entities = filtered_entities.filter(
          (staff) => staff.role_id === filter.role_id,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (staff) => staff.status === filter.status,
        );
      }
    }

    const page_number = options?.page_number ?? 1;
    const page_size = options?.page_size ?? 10;
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

  async find_by_team(team_id: string): Promise<TeamStaff[]> {
    await this.simulate_network_delay();
    await this.ensure_cache_initialized();

    return Array.from(this.entity_cache.values()).filter(
      (staff) => staff.team_id === team_id,
    );
  }

  async find_by_role(role_id: string): Promise<TeamStaff[]> {
    await this.simulate_network_delay();
    await this.ensure_cache_initialized();

    return Array.from(this.entity_cache.values()).filter(
      (staff) => staff.role_id === role_id,
    );
  }
}

let team_staff_repository_instance: InMemoryTeamStaffRepository | null = null;

export function get_team_staff_repository(): InMemoryTeamStaffRepository {
  if (!team_staff_repository_instance) {
    team_staff_repository_instance = new InMemoryTeamStaffRepository();
  }
  return team_staff_repository_instance;
}

export function reset_team_staff_repository(): void {
  if (team_staff_repository_instance) {
    team_staff_repository_instance.clear_all_data();
  }
}
