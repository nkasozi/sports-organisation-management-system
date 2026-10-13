import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
} from "../../core/entities/CompetitionStage";
import type {
  CompetitionStageFilter,
  CompetitionStageRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { find_rows_by_index } from "./InBrowserRepositoryIndexLookup";
import {
  create_warning_failure_details,
  with_failure_context,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";

const ENTITY_PREFIX = "stage";

enum COMPETITION_STAGE_INDEX {
  COMPETITION_ID = "competition_id",
}

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
    id: CompetitionStage["id"],
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
    } as CompetitionStage;
  }

  protected apply_updates_to_entity(
    entity: CompetitionStage,
    updates: UpdateCompetitionStageInput,
  ): CompetitionStage {
    return {
      ...entity,
      ...updates,
    } as CompetitionStage;
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
    competition_id: CompetitionStage["competition_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionStage> {
    const stages_result = await find_rows_by_index({
      table: this.database.competition_stages,
      index_name: COMPETITION_STAGE_INDEX.COMPETITION_ID,
      value: competition_id,
      failure: with_failure_context(
        create_warning_failure_details(
          "[CompetitionStageRepository] Failed to fetch stages for competition",
          "repository_fetch_stages_for_competition_failed",
          "fetch stages for competition",
        ),
        { competition_id },
      ),
    });
    if (!stages_result.success) return stages_result;
    const sorted_stages = [...stages_result.data].sort(
      (a, b) => a.stage_order - b.stage_order,
    );
    return create_success_result(
      this.create_paginated_result(
        this.apply_pagination(sorted_stages, options),
        sorted_stages.length,
        options,
      ),
    );
  }
}

const get_concrete_repository: () => InBrowserCompetitionStageRepository =
  create_lazy_repository_accessor(
    () => new InBrowserCompetitionStageRepository(),
  );

export function get_competition_stage_repository(): CompetitionStageRepository {
  return get_concrete_repository();
}
