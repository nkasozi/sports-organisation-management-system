import type {
  GameEventLog,
  CreateGameEventLogInput,
  UpdateGameEventLogInput,
  GameEventLogType,
  TeamSide,
} from "../entities/GameEventLog";
import { is_scoring_event } from "../entities/GameEventLog";
import type {
  GameEventLogRepository,
  GameEventLogFilter,
} from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import type { GameEventLogUseCasesPort } from "../interfaces/ports";
import { get_repository_container } from "../../infrastructure/container";
import { EventBus } from "$lib/infrastructure/events/EventBus";

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

    async get_by_id(id: string): AsyncResult<GameEventLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("GameEventLog ID is required");
      }
      return repository.find_by_id(id);
    },

    async update(
      id: string,
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

    async delete(id: string): AsyncResult<boolean> {
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
      live_game_log_id: string,
      options?: { page: number; page_size: number },
    ): PaginatedAsyncResult<GameEventLog> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return create_failure_result("Live game log ID is required");
      }
      return repository.get_events_for_live_game(live_game_log_id, options);
    },

    async get_events_for_fixture(
      fixture_id: string,
      options?: { page: number; page_size: number },
    ): PaginatedAsyncResult<GameEventLog> {
      if (!fixture_id || fixture_id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }
      return repository.get_events_for_fixture(fixture_id, options);
    },

    async get_events_for_player(
      player_id: string,
      options?: { page: number; page_size: number },
    ): PaginatedAsyncResult<GameEventLog> {
      if (!player_id || player_id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }
      return repository.get_events_for_player(player_id, options);
    },

    async get_scoring_events_for_live_game(
      live_game_log_id: string,
    ): AsyncResult<GameEventLog[]> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return create_failure_result("Live game log ID is required");
      }
      return repository.get_scoring_events_for_live_game(live_game_log_id);
    },

    async get_card_events_for_live_game(
      live_game_log_id: string,
    ): AsyncResult<GameEventLog[]> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return create_failure_result("Live game log ID is required");
      }
      return repository.get_card_events_for_live_game(live_game_log_id);
    },

    async void_event(
      id: string,
      reason: string,
      voided_by_user_id: string,
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

    async record_goal(
      live_game_log_id: string,
      fixture_id: string,
      organization_id: string,
      minute: number,
      team_side: TeamSide,
      player_id: string,
      player_name: string,
      recorded_by_user_id: string,
    ): AsyncResult<GameEventLog> {
      const input: CreateGameEventLogInput = {
        organization_id,
        live_game_log_id,
        fixture_id,
        event_type: "goal",
        minute,
        stoppage_time_minute: null,
        team_side,
        player_id,
        player_name,
        secondary_player_id: "",
        secondary_player_name: "",
        description: `Goal by ${player_name}`,
        affects_score: true,
        score_change_home: team_side === "home" ? 1 : 0,
        score_change_away: team_side === "away" ? 1 : 0,
        recorded_by_user_id,
        status: "active",
      };

      const result = await repository.create(input);

      if (result.success && result.data) {
        EventBus.emit_entity_created(
          "gameeventlog",
          result.data.id,
          `${result.data.event_type || "Event"} at ${result.data.minute || 0}'`,
          result.data as unknown as Record<string, unknown>,
        );
      }

      return result;
    },

    async record_card(
      live_game_log_id: string,
      fixture_id: string,
      organization_id: string,
      minute: number,
      team_side: TeamSide,
      player_id: string,
      player_name: string,
      card_type: "yellow_card" | "red_card" | "second_yellow" | "green_card",
      recorded_by_user_id: string,
    ): AsyncResult<GameEventLog> {
      const card_label =
        card_type === "yellow_card"
          ? "Yellow card"
          : card_type === "red_card"
            ? "Red card"
            : card_type === "second_yellow"
              ? "Second yellow card"
              : "Green card";

      const input: CreateGameEventLogInput = {
        organization_id,
        live_game_log_id,
        fixture_id,
        event_type: card_type,
        minute,
        stoppage_time_minute: null,
        team_side,
        player_id,
        player_name,
        secondary_player_id: "",
        secondary_player_name: "",
        description: `${card_label} for ${player_name}`,
        affects_score: false,
        score_change_home: 0,
        score_change_away: 0,
        recorded_by_user_id,
        status: "active",
      };

      const result = await repository.create(input);

      if (result.success && result.data) {
        EventBus.emit_entity_created(
          "gameeventlog",
          result.data.id,
          `${result.data.event_type || "Event"} at ${result.data.minute || 0}'`,
          result.data as unknown as Record<string, unknown>,
        );
      }

      return result;
    },

    async record_substitution(
      live_game_log_id: string,
      fixture_id: string,
      organization_id: string,
      minute: number,
      team_side: TeamSide,
      player_out_id: string,
      player_out_name: string,
      player_in_id: string,
      player_in_name: string,
      recorded_by_user_id: string,
    ): AsyncResult<GameEventLog> {
      const input: CreateGameEventLogInput = {
        organization_id,
        live_game_log_id,
        fixture_id,
        event_type: "substitution",
        minute,
        stoppage_time_minute: null,
        team_side,
        player_id: player_out_id,
        player_name: player_out_name,
        secondary_player_id: player_in_id,
        secondary_player_name: player_in_name,
        description: `${player_out_name} replaced by ${player_in_name}`,
        affects_score: false,
        score_change_home: 0,
        score_change_away: 0,
        recorded_by_user_id,
        status: "active",
      };

      const result = await repository.create(input);

      if (result.success && result.data) {
        EventBus.emit_entity_created(
          "gameeventlog",
          result.data.id,
          `${result.data.event_type || "Event"} at ${result.data.minute || 0}'`,
          result.data as unknown as Record<string, unknown>,
        );
      }

      return result;
    },
  };
}

export function get_game_event_log_use_cases(): GameEventLogUseCases {
  const container = get_repository_container();
  return create_game_event_log_use_cases(container.game_event_log_repository);
}
