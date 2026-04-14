import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  CreateGameEventLogInput,
  GameEventLog,
  UpdateGameEventLogInput,
} from "../entities/GameEventLog";
import type {
  GameEventLogFilter,
  GameEventLogRepository,
  GameEventLogUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import { create_game_event_recorder } from "./GameEventRecorderUseCases";

export type GameEventLogUseCases = GameEventLogUseCasesPort;

export function create_game_event_log_use_cases(
  repository: GameEventLogRepository,
): GameEventLogUseCases {
  return {
    async create(input: CreateGameEventLogInput): AsyncResult<GameEventLog> {
      if (!input.live_game_log_id?.trim()) {
        return create_failure_result("Live game log ID is required");
      }

      if (!input.fixture_id?.trim()) {
        return create_failure_result("Fixture ID is required");
      }

      if (!input.organization_id?.trim()) {
        return create_failure_result("Organization ID is required");
      }

      if (!input.event_type?.trim()) {
        return create_failure_result("Event type is required");
      }

      return repository.create(input);
    },

    async get_by_id(
      id: ScalarValueInput<GameEventLog["id"]>,
    ): AsyncResult<GameEventLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("GameEventLog ID is required");
      }
      return repository.find_by_id(id);
    },

    async update(
      id: ScalarValueInput<GameEventLog["id"]>,
      input: UpdateGameEventLogInput,
    ): AsyncResult<GameEventLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("GameEventLog ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Game event log not found");
      }

      if (existing_result.data.voided) {
        return create_failure_result("Cannot update a voided event");
      }

      return repository.update(id, input);
    },

    async delete(
      id: ScalarValueInput<GameEventLog["id"]>,
    ): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("GameEventLog ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Game event log not found");
      }

      return repository.delete_by_id(id);
    },

    async list(
      filter?: GameEventLogFilter,
      pagination?: { page: number; page_size: number },
    ): PaginatedAsyncResult<GameEventLog> {
      return repository.find_all(filter, pagination);
    },

    async get_events_for_live_game(
      live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
      options?: { page: number; page_size: number },
    ): PaginatedAsyncResult<GameEventLog> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return create_failure_result("Live game log ID is required");
      }
      return repository.get_events_for_live_game(live_game_log_id, options);
    },

    async get_events_for_fixture(
      fixture_id: ScalarValueInput<GameEventLog["fixture_id"]>,
      options?: { page: number; page_size: number },
    ): PaginatedAsyncResult<GameEventLog> {
      if (!fixture_id || fixture_id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }
      return repository.get_events_for_fixture(fixture_id, options);
    },

    async get_events_for_player(
      player_id: ScalarValueInput<GameEventLog["player_id"]>,
      options?: { page: number; page_size: number },
    ): PaginatedAsyncResult<GameEventLog> {
      if (!player_id || player_id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }
      return repository.get_events_for_player(player_id, options);
    },

    async get_scoring_events_for_live_game(
      live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
    ): AsyncResult<GameEventLog[]> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return create_failure_result("Live game log ID is required");
      }
      return repository.get_scoring_events_for_live_game(live_game_log_id);
    },

    async get_card_events_for_live_game(
      live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
    ): AsyncResult<GameEventLog[]> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return create_failure_result("Live game log ID is required");
      }
      return repository.get_card_events_for_live_game(live_game_log_id);
    },

    async void_event(
      id: ScalarValueInput<GameEventLog["id"]>,
      reason: string,
      voided_by_user_id: ScalarValueInput<GameEventLog["reviewed_by_user_id"]>,
    ): AsyncResult<GameEventLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("GameEventLog ID is required");
      }

      if (!reason || reason.trim().length === 0) {
        return create_failure_result("Void reason is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Game event log not found");
      }

      if (existing_result.data.voided) {
        return create_failure_result("Event is already voided");
      }

      const old_event = existing_result.data;
      const result = await repository.void_event(id, reason, voided_by_user_id);

      if (result.success && result.data) {
        EventBus.emit_entity_updated(
          "gameeventlog",
          result.data.id,
          `${result.data.event_type || "Event"} at ${result.data.minute || 0}'`,
          old_event as unknown as Record<string, unknown>,
          result.data as unknown as Record<string, unknown>,
          ["voided", "void_reason", "voided_by_user_id"],
        );
      }

      return result;
    },

    ...create_game_event_recorder(repository),
  };
}
