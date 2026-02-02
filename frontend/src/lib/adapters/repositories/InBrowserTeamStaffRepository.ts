import type { Table } from "dexie";
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
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "team_staff";

export class InBrowserTeamStaffRepository
  extends InBrowserBaseRepository<
    TeamStaff,
    CreateTeamStaffInput,
    UpdateTeamStaffInput
  >
  implements TeamStaffRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<TeamStaff, string> {
    return this.database.team_staff;
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
    try {
      let filtered_entities = await this.database.team_staff.toArray();

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
        `Failed to filter team staff: ${error_message}`,
      );
    }
  }

  async find_by_team(team_id: string): Promise<TeamStaff[]> {
    try {
      return await this.database.team_staff
        .where("team_id")
        .equals(team_id)
        .toArray();
    } catch (error) {
      console.error(
        "[InBrowserTeamStaffRepository] find_by_team error:",
        error,
      );
      return [];
    }
  }

  async find_by_role(role_id: string): Promise<TeamStaff[]> {
    try {
      return await this.database.team_staff
        .where("role_id")
        .equals(role_id)
        .toArray();
    } catch (error) {
      console.error(
        "[InBrowserTeamStaffRepository] find_by_role error:",
        error,
      );
      return [];
    }
  }
}

export function create_default_team_staff(): TeamStaff[] {
  const now = new Date().toISOString();

  return [
    {
      id: "team_staff_default_1",
      first_name: "John",
      last_name: "Mukasa",
      email: "john.mukasa@ugandahockey.org",
      phone: "+256-700-111-001",
      date_of_birth: "1975-03-15",
      team_id: "team_default_1",
      role_id: "staff_role_default_1",
      nationality: "Ugandan",
      profile_image_url: DEFAULT_STAFF_AVATAR,
      employment_start_date: "2018-01-01",
      employment_end_date: null,
      emergency_contact_name: "Sarah Mukasa",
      emergency_contact_phone: "+256-700-111-002",
      notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_default_2",
      first_name: "Grace",
      last_name: "Nalwanga",
      email: "grace.nalwanga@ugandahockey.org",
      phone: "+256-700-222-001",
      date_of_birth: "1980-07-22",
      team_id: "team_default_1",
      role_id: "staff_role_default_2",
      nationality: "Ugandan",
      profile_image_url: DEFAULT_STAFF_AVATAR,
      employment_start_date: "2019-06-15",
      employment_end_date: null,
      emergency_contact_name: "Peter Nalwanga",
      emergency_contact_phone: "+256-700-222-002",
      notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_default_3",
      first_name: "David",
      last_name: "Okello",
      email: "david.okello@ugandahockey.org",
      phone: "+256-700-333-001",
      date_of_birth: "1985-11-10",
      team_id: "team_default_2",
      role_id: "staff_role_default_1",
      nationality: "Ugandan",
      profile_image_url: DEFAULT_STAFF_AVATAR,
      employment_start_date: "2020-02-01",
      employment_end_date: null,
      emergency_contact_name: "Mary Okello",
      emergency_contact_phone: "+256-700-333-002",
      notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserTeamStaffRepository | null = null;

export function get_team_staff_repository(): TeamStaffRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserTeamStaffRepository();
  }
  return singleton_instance;
}

export async function initialize_team_staff_repository(): Promise<void> {
  const repository =
    get_team_staff_repository() as InBrowserTeamStaffRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_team_staff());
  }
}

export async function reset_team_staff_repository(): Promise<void> {
  const repository =
    get_team_staff_repository() as InBrowserTeamStaffRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_team_staff());
}
