import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../entities/Competition";
import type {
  CompetitionRepository,
  CompetitionFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type { EntityListResult } from "../entities/BaseEntity";
import type { CompetitionUseCasesPort } from "../interfaces/ports";
import { create_success_result, create_failure_result } from "../types/Result";
import { validate_competition_input } from "../entities/Competition";
import { get_repository_container } from "../../infrastructure/container";
import { EventBus } from "$lib/infrastructure/events/EventBus";
import { create_competition_stage_lifecycle } from "./CompetitionStageLifecycle";

export type CompetitionUseCases = CompetitionUseCasesPort;

export interface CompetitionStageLifecyclePort {
  ensure_stages_for_competition(
    competition_id: string,
    competition_format_id: string,
  ): Promise<AsyncResult<boolean>>;
  can_replace_stages_for_competition(
    competition_id: string,
  ): Promise<AsyncResult<boolean>>;
  replace_stages_for_competition(
    competition_id: string,
    competition_format_id: string,
  ): Promise<AsyncResult<boolean>>;
}

export function create_competition_use_cases_with_stage_lifecycle(
  repository: CompetitionRepository,
  stage_lifecycle: CompetitionStageLifecyclePort,
): CompetitionUseCases {
  return {
    async list(
      filter?: CompetitionFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Competition>> {
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

    async get_by_id(id: string): AsyncResult<Competition> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreateCompetitionInput): AsyncResult<Competition> {
      const validation_errors = validate_competition_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      const create_result = await repository.create(input);
      if (!create_result.success || !create_result.data) {
        return create_result;
      }

      const ensure_stages_result =
        await stage_lifecycle.ensure_stages_for_competition(
          create_result.data.id,
          create_result.data.competition_format_id,
        );
      if (!ensure_stages_result.success) {
        await repository.delete_by_id(create_result.data.id);
        return create_failure_result(ensure_stages_result.error);
      }

      return create_success_result(create_result.data);
    },

    async update(
      id: string,
      input: UpdateCompetitionInput,
    ): AsyncResult<Competition> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Competition not found");
      }

      const next_competition_format_id =
        input.competition_format_id ?? existing_result.data.competition_format_id;
      const format_has_changed =
        next_competition_format_id !== existing_result.data.competition_format_id;

      if (format_has_changed) {
        const can_replace_stages_result =
          await stage_lifecycle.can_replace_stages_for_competition(id);
        if (!can_replace_stages_result.success) {
          return create_failure_result(can_replace_stages_result.error);
        }
      }

      const update_result = await repository.update(id, input);
      if (!update_result.success || !update_result.data) {
        return update_result;
      }

      if (format_has_changed) {
        const replace_stages_result =
          await stage_lifecycle.replace_stages_for_competition(
            id,
            next_competition_format_id,
          );
        if (!replace_stages_result.success) {
          return create_failure_result(replace_stages_result.error);
        }
      } else {
        const ensure_stages_result =
          await stage_lifecycle.ensure_stages_for_competition(
            id,
            next_competition_format_id,
          );
        if (!ensure_stages_result.success) {
          return create_failure_result(ensure_stages_result.error);
        }
      }

      return create_success_result(update_result.data);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_competitions(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one competition ID is required");
      }

      const competitions_to_delete = await Promise.all(
        ids.map((competition_id) => repository.find_by_id(competition_id)),
      );

      const result = await repository.delete_by_ids(ids);

      if (result.success) {
        for (const comp_result of competitions_to_delete) {
          if (comp_result.success && comp_result.data) {
            const comp = comp_result.data;
            EventBus.emit_entity_deleted(
              "competition",
              comp.id,
              comp.name || comp.id,
              comp as unknown as Record<string, unknown>,
            );
          }
        }
      }

      return result;
    },

    async list_competitions_by_organization(
      organization_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Competition>> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },
  };
}

export function create_competition_use_cases(
  repository: CompetitionRepository,
): CompetitionUseCases {
  const container = get_repository_container();
  const stage_lifecycle = create_competition_stage_lifecycle(
    container.competition_format_repository,
    container.competition_stage_repository,
    container.fixture_repository,
  );
  return create_competition_use_cases_with_stage_lifecycle(
    repository,
    stage_lifecycle,
  );
}

export function get_competition_use_cases(): CompetitionUseCases {
  const container = get_repository_container();
  return create_competition_use_cases(container.competition_repository);
}
