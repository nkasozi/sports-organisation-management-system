import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
  FormatType,
} from "../entities/CompetitionFormat";
import type {
  CompetitionFormatRepository,
  CompetitionFormatFilter,
} from "../interfaces/adapters/CompetitionFormatRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { validate_competition_format_input } from "../entities/CompetitionFormat";
import { get_competition_format_repository } from "../../adapters/repositories/InMemoryCompetitionFormatRepository";
import type { EntityOperationResult, EntityListResult } from "./BaseUseCases";
import type { CompetitionFormatUseCasesPort } from "../interfaces/ports/CompetitionFormatUseCasesPort";

export type CompetitionFormatUseCases = CompetitionFormatUseCasesPort;

export function create_competition_format_use_cases(
  repository: CompetitionFormatRepository,
): CompetitionFormatUseCases {
  return {
    async list(
      filter?: CompetitionFormatFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<CompetitionFormat>> {
      const page_number = pagination?.page ?? 1;
      const page_size = pagination?.page_size ?? 10;
      const query_options = { page_number, page_size };

      const formats_result = filter
        ? await repository.find_by_filter(filter, query_options)
        : await repository.find_all(query_options);
      if (!formats_result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: formats_result.error,
        };
      }
      return {
        success: true,
        data: formats_result.data?.items || [],
        total_count: formats_result.data?.total_count || 0,
      };
    },

    async get_by_id(
      id: string,
    ): Promise<EntityOperationResult<CompetitionFormat>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Format ID is required" };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateCompetitionFormatInput,
    ): Promise<EntityOperationResult<CompetitionFormat>> {
      const validation = validate_competition_format_input(input);
      if (!validation.is_valid) {
        return { success: false, error_message: validation.errors.join(", ") };
      }

      const existing = await repository.find_by_code(input.code);
      if (existing) {
        return {
          success: false,
          error_message: `Format with code '${input.code}' already exists`,
        };
      }

      const result = await repository.create(input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdateCompetitionFormatInput,
    ): Promise<EntityOperationResult<CompetitionFormat>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Format ID is required" };
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return { success: false, error_message: "Format not found" };
      }

      if (input.code) {
        const code_check = await repository.find_by_code(input.code);
        if (code_check && code_check.id !== id) {
          return {
            success: false,
            error_message: `Format with code '${input.code}' already exists`,
          };
        }
      }

      const merged_input = { ...existing_result.data, ...input };
      const validation = validate_competition_format_input(
        merged_input as CreateCompetitionFormatInput,
      );
      if (!validation.is_valid) {
        return { success: false, error_message: validation.errors.join(", ") };
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Format ID is required" };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async get_format_by_code(
      code: string,
    ): AsyncResult<CompetitionFormat | null> {
      const format = await repository.find_by_code(code);
      return create_success_result(format);
    },

    async list_formats_by_type(
      format_type: FormatType,
    ): AsyncResult<CompetitionFormat[]> {
      const formats = await repository.find_by_format_type(format_type);
      return create_success_result(formats);
    },

    async list_active_formats(): AsyncResult<CompetitionFormat[]> {
      const formats = await repository.find_active_formats();
      return create_success_result(formats);
    },
  };
}

let use_cases_instance: CompetitionFormatUseCases | null = null;

export function get_competition_format_use_cases(): CompetitionFormatUseCases {
  if (!use_cases_instance) {
    const repository = get_competition_format_repository();
    use_cases_instance = create_competition_format_use_cases(repository);
  }
  return use_cases_instance;
}
