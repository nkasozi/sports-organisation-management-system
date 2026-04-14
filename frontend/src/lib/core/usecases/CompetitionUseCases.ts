import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../entities/Competition";
import { validate_competition_input } from "../entities/Competition";
import type {
  CompetitionFilter,
  CompetitionRepository,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { CompetitionUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

export type CompetitionUseCases = CompetitionUseCasesPort;

export interface CompetitionStageLifecyclePort {
  ensure_stages_for_competition(
    competition_id: ScalarValueInput<Competition["id"]>,
    competition_format_id: ScalarValueInput<Competition["competition_format_id"]>,
  ): Promise<AsyncResult<boolean>>;
  can_replace_stages_for_competition(
    competition_id: ScalarValueInput<Competition["id"]>,
  ): Promise<AsyncResult<boolean>>;
  replace_stages_for_competition(
    competition_id: ScalarValueInput<Competition["id"]>,
    competition_format_id: ScalarValueInput<Competition["competition_format_id"]>,
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
    ): PaginatedAsyncResult<Competition> {
      return repository.find_all(filter, options);
    },

    async get_by_id(
      id: ScalarValueInput<Competition["id"]>,
    ): AsyncResult<Competition> {
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
      id: ScalarValueInput<Competition["id"]>,
      input: UpdateCompetitionInput,
    ): AsyncResult<Competition> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Competition not found");
      }

      const next_competition_format_id = (input.competition_format_id ??
        existing_result.data
          .competition_format_id) as Competition["competition_format_id"];
      const format_has_changed =
        next_competition_format_id !==
        existing_result.data.competition_format_id;

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

    async delete(
      id: ScalarValueInput<Competition["id"]>,
    ): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_competitions(
      ids: Array<ScalarValueInput<Competition["id"]>>,
    ): AsyncResult<number> {
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
      organization_id: ScalarValueInput<Competition["organization_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Competition> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },
  };
}
