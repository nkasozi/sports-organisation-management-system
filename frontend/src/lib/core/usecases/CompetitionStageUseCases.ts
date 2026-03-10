import type {
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
} from "../entities/CompetitionStage";
import { validate_competition_stage_input } from "../entities/CompetitionStage";
import type {
  CompetitionStageRepository,
  CompetitionStageFilter,
} from "../interfaces/ports";
import type { FixtureRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import type { CompetitionStageUseCasesPort } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { EntityListResult } from "./BaseUseCases";
import { get_repository_container } from "../../infrastructure/container";

export type CompetitionStageUseCases = CompetitionStageUseCasesPort;

export function create_competition_stage_use_cases(
  repository: CompetitionStageRepository,
  fixture_repository: FixtureRepository,
): CompetitionStageUseCases {
  return {
    async create(
      input: CreateCompetitionStageInput,
    ): AsyncResult<CompetitionStage> {
      const validation_errors = validate_competition_stage_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      const result = await repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async get_by_id(id: string): AsyncResult<CompetitionStage> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Stage ID is required");
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async list(
      filter?: CompetitionStageFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<CompetitionStage>> {
      const result = await repository.find_all(filter, options);
      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }
      return {
        success: true,
        data: result.data?.items || [],
        total_count: result.data?.total_count || 0,
      };
    },

    async update(
      id: string,
      input: UpdateCompetitionStageInput,
    ): AsyncResult<CompetitionStage> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Stage ID is required");
      }
      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Stage ID is required");
      }
      const linked_fixtures_check = await check_for_linked_fixtures(
        id,
        fixture_repository,
      );
      if (!linked_fixtures_check.success) {
        return linked_fixtures_check;
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async list_stages_by_competition(
      competition_id: string,
      options?: QueryOptions,
    ): Promise<EntityListResult<CompetitionStage>> {
      if (!competition_id || competition_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Competition ID is required",
        };
      }
      const result = await repository.find_by_competition(
        competition_id,
        options,
      );
      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }
      const sorted_stages = [...(result.data?.items || [])].sort(
        (a, b) => a.stage_order - b.stage_order,
      );
      return {
        success: true,
        data: sorted_stages,
        total_count: result.data?.total_count || 0,
      };
    },

    async reorder_stages(
      competition_id: string,
      ordered_stage_ids: string[],
    ): AsyncResult<boolean> {
      if (!competition_id || competition_id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      if (!ordered_stage_ids || ordered_stage_ids.length === 0) {
        return create_failure_result(
          "At least one stage ID is required for reordering",
        );
      }
      for (let i = 0; i < ordered_stage_ids.length; i++) {
        const update_result = await repository.update(ordered_stage_ids[i], {
          stage_order: i + 1,
        });
        if (!update_result.success) {
          return create_failure_result(
            `Failed to update stage order for stage ${ordered_stage_ids[i]}: ${update_result.error}`,
          );
        }
      }
      return create_success_result(true);
    },
  };
}

async function check_for_linked_fixtures(
  stage_id: string,
  fixture_repository: FixtureRepository,
): AsyncResult<boolean> {
  const fixtures_result = await fixture_repository.find_all(
    { stage_id } as Parameters<typeof fixture_repository.find_all>[0],
    { page_size: 1 },
  );
  if (!fixtures_result.success) {
    return create_success_result(true);
  }
  const fixture_count = fixtures_result.data?.total_count ?? 0;
  if (fixture_count > 0) {
    return create_failure_result(
      `Cannot delete stage: it has ${fixture_count} linked fixtures. Remove or reassign them first.`,
    );
  }
  return create_success_result(true);
}

export function get_competition_stage_use_cases(): CompetitionStageUseCases {
  const container = get_repository_container();
  return create_competition_stage_use_cases(
    container.competition_stage_repository,
    container.fixture_repository,
  );
}
