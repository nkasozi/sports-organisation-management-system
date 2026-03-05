import type { Table } from "dexie";
import type {
  OfficialAssociatedTeam,
  CreateOfficialAssociatedTeamInput,
  UpdateOfficialAssociatedTeamInput,
} from "../../core/entities/OfficialAssociatedTeam";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  OfficialAssociatedTeamRepository,
  OfficialAssociatedTeamFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "oat";

export class InBrowserOfficialAssociatedTeamRepository
  extends InBrowserBaseRepository<
    OfficialAssociatedTeam,
    CreateOfficialAssociatedTeamInput,
    UpdateOfficialAssociatedTeamInput
  >
  implements OfficialAssociatedTeamRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<OfficialAssociatedTeam, string> {
    return this.database.official_associated_teams;
  }

  protected create_entity_from_input(
    input: CreateOfficialAssociatedTeamInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): OfficialAssociatedTeam {
    return {
      id,
      ...timestamps,
      official_id: input.official_id,
      team_id: input.team_id,
      association_type: input.association_type,
      start_date: input.start_date || "",
      end_date: input.end_date || "",
      notes: input.notes || "",
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: OfficialAssociatedTeam,
    updates: UpdateOfficialAssociatedTeamInput,
  ): OfficialAssociatedTeam {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: OfficialAssociatedTeamFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam> {
    try {
      let filtered_entities =
        await this.database.official_associated_teams.toArray();

      if (filter.official_id) {
        filtered_entities = filtered_entities.filter(
          (oat) => oat.official_id === filter.official_id,
        );
      }

      if (filter.team_id) {
        filtered_entities = filtered_entities.filter(
          (oat) => oat.team_id === filter.team_id,
        );
      }

      if (filter.association_type) {
        filtered_entities = filtered_entities.filter(
          (oat) => oat.association_type === filter.association_type,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (oat) => oat.status === filter.status,
        );
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
        `Failed to filter official associated teams: ${error_message}`,
      );
    }
  }

  async find_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam> {
    return this.find_by_filter({ official_id }, options);
  }

  async find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam> {
    return this.find_by_filter({ team_id }, options);
  }
}

export function create_default_official_associated_teams(): OfficialAssociatedTeam[] {
  return [];
}

let singleton_instance: InBrowserOfficialAssociatedTeamRepository | null = null;

export function get_official_associated_team_repository(): OfficialAssociatedTeamRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserOfficialAssociatedTeamRepository();
  }
  return singleton_instance;
}

export async function initialize_official_associated_team_repository(): Promise<void> {
  const repository =
    get_official_associated_team_repository() as InBrowserOfficialAssociatedTeamRepository;
  const result = await repository.find_all(undefined, {
    page_number: 1,
    page_size: 1,
  });

  if (result.success && result.data?.items?.length === 0) {
    const default_items = create_default_official_associated_teams();
    for (const item of default_items) {
      await repository.create({
        official_id: item.official_id,
        team_id: item.team_id,
        association_type: item.association_type,
        start_date: item.start_date,
        end_date: item.end_date,
        notes: item.notes,
        status: item.status,
      });
    }
  }
}
