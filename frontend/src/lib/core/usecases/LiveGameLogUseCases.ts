import type {
  CreateLiveGameLogInput,
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../entities/LiveGameLog";
import { GAME_STATUS } from "../entities/StatusConstants";
import type {
  LiveGameLogFilter,
  LiveGameLogRepository,
  LiveGameLogUseCasesPort,
} from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import { create_live_game_state_management } from "./LiveGameStateManagementUseCases";

export type LiveGameLogUseCases = LiveGameLogUseCasesPort;

export function create_live_game_log_use_cases(
  repository: LiveGameLogRepository,
): LiveGameLogUseCases {
  return {
    async create(input: CreateLiveGameLogInput): AsyncResult<LiveGameLog> {
      if (!input.fixture_id?.trim()) {
        return create_failure_result("Fixture ID is required");
      }

      if (!input.organization_id?.trim()) {
        return create_failure_result("Organization ID is required");
      }

      const existing_result = await repository.get_live_game_log_for_fixture(
        input.fixture_id,
      );

      if (existing_result.success) {
        return create_failure_result(
          "A live game log already exists for this fixture",
        );
      }

      return repository.create(input);
    },

    async get_by_id(id: string): AsyncResult<LiveGameLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("LiveGameLog ID is required");
      }
      return repository.find_by_id(id);
    },

    async update(
      id: string,
      input: UpdateLiveGameLogInput,
    ): AsyncResult<LiveGameLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("LiveGameLog ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("LiveGameLog ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      if (existing_result.data.game_status === GAME_STATUS.IN_PROGRESS) {
        return create_failure_result("Cannot delete an in-progress game");
      }

      return repository.delete_by_id(id);
    },

    async list(
      filter?: LiveGameLogFilter,
      pagination?: { page: number; page_size: number },
    ): PaginatedAsyncResult<LiveGameLog> {
      return repository.find_all(filter, pagination);
    },

    async get_live_game_log_for_fixture(
      fixture_id: string,
    ): AsyncResult<LiveGameLog> {
      if (!fixture_id || fixture_id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }
      return repository.get_live_game_log_for_fixture(fixture_id);
    },

    async get_active_games(
      organization_id?: string,
    ): AsyncResult<LiveGameLog[]> {
      return repository.get_active_games(organization_id);
    },

    ...create_live_game_state_management(repository),

    async list_by_organization(
      organization_id: string,
      options?: { page: number; page_size: number },
    ): PaginatedAsyncResult<LiveGameLog> {
      return repository.find_by_organization(organization_id, options);
    },

    async list_completed_games(
      organization_id?: string,
      options?: { page: number; page_size: number },
    ): PaginatedAsyncResult<LiveGameLog> {
      return repository.find_completed_games(organization_id, options);
    },
  };
}
