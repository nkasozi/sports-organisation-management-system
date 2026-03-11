import type { Table } from "dexie";
import type {
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
} from "../../core/entities/CompetitionStage";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CompetitionStageRepository,
  CompetitionStageFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "stage";

export class InBrowserCompetitionStageRepository
  extends InBrowserBaseRepository<
    CompetitionStage,
    CreateCompetitionStageInput,
    UpdateCompetitionStageInput,
    CompetitionStageFilter
  >
  implements CompetitionStageRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<CompetitionStage, string> {
    return this.database.competition_stages;
  }

  protected create_entity_from_input(
    input: CreateCompetitionStageInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): CompetitionStage {
    return {
      id,
      ...timestamps,
      competition_id: input.competition_id,
      name: input.name,
      stage_type: input.stage_type,
      stage_order: input.stage_order,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: CompetitionStage,
    updates: UpdateCompetitionStageInput,
  ): CompetitionStage {
    return {
      ...entity,
      ...updates,
    };
  }

  protected apply_entity_filter(
    entities: CompetitionStage[],
    filter: CompetitionStageFilter,
  ): CompetitionStage[] {
    let filtered_entities = entities;

    if (filter.competition_id) {
      filtered_entities = filtered_entities.filter(
        (stage) => stage.competition_id === filter.competition_id,
      );
    }

    if (filter.stage_type) {
      filtered_entities = filtered_entities.filter(
        (stage) => stage.stage_type === filter.stage_type,
      );
    }

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter((stage) =>
        stage.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (stage) => stage.status === filter.status,
      );
    }

    return filtered_entities;
  }

  async find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionStage> {
    try {
      const all_stages = await this.database.competition_stages
        .where("competition_id")
        .equals(competition_id)
        .toArray();

      const sorted_stages = all_stages.sort(
        (a, b) => a.stage_order - b.stage_order,
      );

      const total_count = sorted_stages.length;
      const paginated_stages = this.apply_pagination(sorted_stages, options);

      return create_success_result(
        this.create_paginated_result(paginated_stages, total_count, options),
      );
    } catch (error) {
      return create_failure_result(
        `Failed to fetch stages for competition: ${error}`,
      );
    }
  }
}

let singleton_instance: InBrowserCompetitionStageRepository | null = null;

export function get_competition_stage_repository(): CompetitionStageRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserCompetitionStageRepository();
  }
  return singleton_instance;
}
