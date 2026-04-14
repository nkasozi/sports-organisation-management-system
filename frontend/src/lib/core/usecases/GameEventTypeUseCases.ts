import type {
  CreateGameEventTypeInput,
  EventCategory,
  GameEventType,
  UpdateGameEventTypeInput,
} from "../entities/GameEventType";
import type { ScalarValueInput } from "../types/DomainScalars";
import type {
  GameEventTypeFilter,
  GameEventTypeRepository,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { GameEventTypeUseCasesPort } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

export type GameEventTypeUseCases = GameEventTypeUseCasesPort;

export function create_game_event_type_use_cases(
  repository: GameEventTypeRepository,
): GameEventTypeUseCases {
  return {
    async list(
      filter?: GameEventTypeFilter,
      pagination?: QueryOptions,
    ): PaginatedAsyncResult<GameEventType> {
      return repository.find_all(filter, pagination);
    },

    async get_by_id(id: GameEventType["id"]): AsyncResult<GameEventType> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Event type ID is required");
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async create(input: CreateGameEventTypeInput): AsyncResult<GameEventType> {
      if (!input.name || input.name.trim().length < 2) {
        return create_failure_result(
          "Event type name must be at least 2 characters",
        );
      }

      if (!input.code || input.code.trim().length < 2) {
        return create_failure_result(
          "Event type code must be at least 2 characters",
        );
      }

      const existing_result = await repository.find_by_code(input.code);
      if (!existing_result.success) {
        return create_failure_result(existing_result.error);
      }
      if (existing_result.data) {
        return create_failure_result(
          `Event type with code '${input.code}' already exists`,
        );
      }

      const result = await repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async update(
      id: GameEventType["id"],
      input: UpdateGameEventTypeInput,
    ): AsyncResult<GameEventType> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Event type ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return create_failure_result("Event type not found");
      }

      if (input.code) {
        const code_check_result = await repository.find_by_code(input.code);
        if (!code_check_result.success) {
          return create_failure_result(code_check_result.error);
        }
        if (code_check_result.data && code_check_result.data.id !== id) {
          return create_failure_result(
            `Event type with code '${input.code}' already exists`,
          );
        }
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: GameEventType["id"]): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Event type ID is required");
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async get_event_type_by_code(
      code: string,
    ): AsyncResult<GameEventType | null> {
      return await repository.find_by_code(code);
    },

    async list_event_types_for_sport(
      sport_id: ScalarValueInput<NonNullable<GameEventType["sport_id"]>>,
    ): AsyncResult<GameEventType[]> {
      return await repository.find_by_sport(sport_id);
    },

    async list_event_types_by_category(
      category: EventCategory,
    ): AsyncResult<GameEventType[]> {
      return await repository.find_by_category(category);
    },

    async list_scoring_event_types(): AsyncResult<GameEventType[]> {
      return await repository.find_scoring_events();
    },
  };
}
