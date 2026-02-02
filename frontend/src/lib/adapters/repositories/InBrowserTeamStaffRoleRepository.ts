import type { Table } from "dexie";
import type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
} from "../../core/entities/TeamStaffRole";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  TeamStaffRoleRepository,
  TeamStaffRoleFilter,
} from "../../core/interfaces/adapters/TeamStaffRoleRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "team_staff_role";

export class InBrowserTeamStaffRoleRepository
  extends InBrowserBaseRepository<
    TeamStaffRole,
    CreateTeamStaffRoleInput,
    UpdateTeamStaffRoleInput
  >
  implements TeamStaffRoleRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<TeamStaffRole, string> {
    return this.database.team_staff_roles;
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
    try {
      let filtered_entities = await this.database.team_staff_roles.toArray();

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

      const total_count = filtered_entities.length;
      const paginated_entities = this.apply_pagination(
        filtered_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter team staff roles: ${error_message}`,
      );
    }
  }

  async find_by_category(
    category: TeamStaffRole["category"],
  ): Promise<TeamStaffRole[]> {
    try {
      const roles = await this.database.team_staff_roles
        .where("category")
        .equals(category)
        .toArray();

      return roles.sort((a, b) => a.display_order - b.display_order);
    } catch (error) {
      console.error(
        `[InBrowserTeamStaffRoleRepository] Failed to find by category: ${error}`,
      );
      return [];
    }
  }
}

export function create_default_team_staff_roles(): TeamStaffRole[] {
  const now = new Date().toISOString();

  return [
    {
      id: "team_staff_role_default_1",
      name: "Head Coach",
      code: "HC",
      description:
        "Primary coach responsible for team strategy and player development",
      category: "coaching",
      is_primary_contact: true,
      display_order: 1,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_2",
      name: "Assistant Coach",
      code: "AC",
      description: "Assists the head coach with training and match preparation",
      category: "coaching",
      is_primary_contact: false,
      display_order: 2,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_3",
      name: "Goalkeeping Coach",
      code: "GKC",
      description: "Specialized coach for goalkeeper training",
      category: "coaching",
      is_primary_contact: false,
      display_order: 3,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_4",
      name: "Fitness Coach",
      code: "FC",
      description: "Responsible for player fitness and conditioning",
      category: "coaching",
      is_primary_contact: false,
      display_order: 4,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_5",
      name: "Team Manager",
      code: "TM",
      description: "Handles administrative and logistical aspects of the team",
      category: "administrative",
      is_primary_contact: true,
      display_order: 5,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_6",
      name: "Team Doctor",
      code: "DOC",
      description: "Medical professional responsible for player health",
      category: "medical",
      is_primary_contact: false,
      display_order: 6,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_7",
      name: "Physiotherapist",
      code: "PHYSIO",
      description: "Treats and prevents injuries through physical therapy",
      category: "medical",
      is_primary_contact: false,
      display_order: 7,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_8",
      name: "Sports Psychologist",
      code: "PSY",
      description: "Provides mental health support and performance psychology",
      category: "medical",
      is_primary_contact: false,
      display_order: 8,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_9",
      name: "Performance Analyst",
      code: "PA",
      description: "Analyzes match and training data to improve performance",
      category: "technical",
      is_primary_contact: false,
      display_order: 9,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_staff_role_default_10",
      name: "Kit Manager",
      code: "KM",
      description: "Manages team equipment and uniforms",
      category: "administrative",
      is_primary_contact: false,
      display_order: 10,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserTeamStaffRoleRepository | null = null;

export function get_team_staff_role_repository(): TeamStaffRoleRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserTeamStaffRoleRepository();
  }
  return singleton_instance;
}

export async function initialize_team_staff_role_repository(): Promise<void> {
  const repository =
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_team_staff_roles());
  }
}

export async function reset_team_staff_role_repository(): Promise<void> {
  const repository =
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_team_staff_roles());
}
