import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  FormatType,
  UpdateCompetitionFormatInput,
} from "../entities/CompetitionFormat";
import {
  hydrate_competition_format_input,
  validate_competition_format_input,
} from "../entities/CompetitionFormat";
import type {
  CompetitionFormatFilter,
  CompetitionFormatRepository,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { CompetitionFormatUseCasesPort } from "../interfaces/ports";
import { is_competition_format_not_found_by_code_error } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

export type CompetitionFormatUseCases = CompetitionFormatUseCasesPort;

export function create_competition_format_use_cases(
  repository: CompetitionFormatRepository,
): CompetitionFormatUseCases {
  return {
    async list(
      filter?: CompetitionFormatFilter,
      pagination?: QueryOptions,
    ): PaginatedAsyncResult<CompetitionFormat> {
      return repository.find_all(filter, pagination);
    },

    async get_by_id(
      id: CompetitionFormat["id"],
    ): AsyncResult<CompetitionFormat> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Format ID is required");
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async create(
      input: CreateCompetitionFormatInput,
    ): AsyncResult<CompetitionFormat> {
      const hydrated_input = hydrate_competition_format_input(input);
      const validation = validate_competition_format_input(hydrated_input);
      if (!validation.is_valid) {
        return create_failure_result(validation.errors.join(", "));
      }

      const existing_result = await repository.find_by_code(
        hydrated_input.code,
      );
      if (
        !existing_result.success &&
        !is_competition_format_not_found_by_code_error(
          existing_result.error,
          hydrated_input.code,
        )
      ) {
        return create_failure_result(existing_result.error);
      }
      if (existing_result.success) {
        return create_failure_result(
          `Format with code '${hydrated_input.code}' already exists`,
        );
      }

      const result = await repository.create(hydrated_input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async update(
      id: CompetitionFormat["id"],
      input: UpdateCompetitionFormatInput,
    ): AsyncResult<CompetitionFormat> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Format ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return create_failure_result("Format not found");
      }

      if (input.code) {
        const code_check_result = await repository.find_by_code(input.code);
        if (
          !code_check_result.success &&
          !is_competition_format_not_found_by_code_error(
            code_check_result.error,
            input.code,
          )
        ) {
          return create_failure_result(code_check_result.error);
        }
        if (code_check_result.success && code_check_result.data.id !== id) {
          return create_failure_result(
            `Format with code '${input.code}' already exists`,
          );
        }
      }

      const merged_input = hydrate_competition_format_input({
        ...existing_result.data,
        ...input,
      } as CreateCompetitionFormatInput);
      const validation = validate_competition_format_input(
        merged_input as CreateCompetitionFormatInput,
      );
      if (!validation.is_valid) {
        return create_failure_result(validation.errors.join(", "));
      }

      const result = await repository.update(id, merged_input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: CompetitionFormat["id"]): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Format ID is required");
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async get_format_by_code(code: string): AsyncResult<CompetitionFormat> {
      return await repository.find_by_code(code);
    },

    async list_formats_by_type(
      format_type: FormatType,
    ): AsyncResult<CompetitionFormat[]> {
      return await repository.find_by_format_type(format_type);
    },

    async list_active_formats(): AsyncResult<CompetitionFormat[]> {
      return await repository.find_active_formats();
    },
  };
}
