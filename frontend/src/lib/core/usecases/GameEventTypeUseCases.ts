import type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  EventCategory,
} from "../entities/GameEventType";
import type {
  GameEventTypeRepository,
  GameEventTypeFilter,
} from "../interfaces/adapters/GameEventTypeRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { get_game_event_type_repository } from "../../adapters/repositories/InBrowserGameEventTypeRepository";
import type { EntityOperationResult, EntityListResult } from "./BaseUseCases";
import type { GameEventTypeUseCasesPort } from "../interfaces/ports/GameEventTypeUseCasesPort";

export type GameEventTypeUseCases = GameEventTypeUseCasesPort;

export function create_game_event_type_use_cases(
  repository: GameEventTypeRepository,
): GameEventTypeUseCases {
  return {
    async list(
      filter?: GameEventTypeFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<GameEventType>> {
      const query_options = {
        page_number: pagination?.page ?? 1,
        page_size: pagination?.page_size ?? 10,
      };
      const result = await repository.find_all(query_options);
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

    async get_by_id(id: string): Promise<EntityOperationResult<GameEventType>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Event type ID is required" };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateGameEventTypeInput,
    ): Promise<EntityOperationResult<GameEventType>> {
      if (!input.name || input.name.trim().length < 2) {
        return {
          success: false,
          error_message: "Event type name must be at least 2 characters",
        };
      }

      if (!input.code || input.code.trim().length < 2) {
        return {
          success: false,
          error_message: "Event type code must be at least 2 characters",
        };
      }

      const existing = await repository.find_by_code(input.code);
      if (existing) {
        return {
          success: false,
          error_message: `Event type with code '${input.code}' already exists`,
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
      input: UpdateGameEventTypeInput,
    ): Promise<EntityOperationResult<GameEventType>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Event type ID is required" };
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return { success: false, error_message: "Event type not found" };
      }

      if (input.code) {
        const code_check = await repository.find_by_code(input.code);
        if (code_check && code_check.id !== id) {
          return {
            success: false,
            error_message: `Event type with code '${input.code}' already exists`,
          };
        }
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Event type ID is required" };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async get_event_type_by_code(
      code: string,
    ): AsyncResult<GameEventType | null> {
      const event_type = await repository.find_by_code(code);
      return create_success_result(event_type);
    },

    async list_event_types_for_sport(
      sport_id: string | null,
    ): AsyncResult<GameEventType[]> {
      const event_types = await repository.find_by_sport(sport_id);
      return create_success_result(event_types);
    },

    async list_event_types_by_category(
      category: EventCategory,
    ): AsyncResult<GameEventType[]> {
      const event_types = await repository.find_by_category(category);
      return create_success_result(event_types);
    },

    async list_scoring_event_types(): AsyncResult<GameEventType[]> {
      const event_types = await repository.find_scoring_events();
      return create_success_result(event_types);
    },
  };
}

let use_cases_instance: GameEventTypeUseCases | null = null;

export function get_game_event_type_use_cases(): GameEventTypeUseCases {
  if (!use_cases_instance) {
    const repository = get_game_event_type_repository();
    use_cases_instance = create_game_event_type_use_cases(repository);
  }
  return use_cases_instance;
}
