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
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { GameEventLogUseCasesPort } from "../interfaces/ports";
import { get_game_event_log_repository } from "../../adapters/repositories/InBrowserGameEventLogRepository";

export type GameEventLogUseCases = GameEventLogUseCasesPort;

export function create_game_event_log_use_cases(
  repository: GameEventLogRepository,
): GameEventLogUseCases {
  return {
    async create(
      input: CreateGameEventLogInput,
    ): Promise<EntityOperationResult<GameEventLog>> {
      if (!input.live_game_log_id?.trim()) {
        return {
          success: false,
          error_message: "Live game log ID is required",
        };
      }

      if (!input.fixture_id?.trim()) {
        return {
          success: false,
          error_message: "Fixture ID is required",
        };
      }

      if (!input.organization_id?.trim()) {
        return {
          success: false,
          error_message: "Organization ID is required",
        };
      }

      if (!input.event_type?.trim()) {
        return {
          success: false,
          error_message: "Event type is required",
        };
      }

      return repository.create_game_event_log(input);
    },

    async get_by_id(id: string): Promise<EntityOperationResult<GameEventLog>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "GameEventLog ID is required",
        };
      }
      return repository.get_game_event_log_by_id(id);
    },

    async update(
      id: string,
      input: UpdateGameEventLogInput,
    ): Promise<EntityOperationResult<GameEventLog>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "GameEventLog ID is required",
        };
      }

      const existing_result = await repository.get_game_event_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Game event log not found",
        };
      }

      if (existing_result.data.voided) {
        return {
          success: false,
          error_message: "Cannot update a voided event",
        };
      }

      return repository.update_game_event_log(id, input);
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "GameEventLog ID is required",
        };
      }

      const existing_result = await repository.get_game_event_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Game event log not found",
        };
      }

      return repository.delete_game_event_log(id);
    },

    async list(
      filter?: GameEventLogFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<GameEventLog>> {
      return repository.find_by_filter(filter, pagination);
    },

    async get_events_for_live_game(
      live_game_log_id: string,
      options?: { page: number; page_size: number },
    ): Promise<EntityListResult<GameEventLog>> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Live game log ID is required",
        };
      }
      return repository.get_events_for_live_game(live_game_log_id, options);
    },

    async get_events_for_fixture(
      fixture_id: string,
      options?: { page: number; page_size: number },
    ): Promise<EntityListResult<GameEventLog>> {
      if (!fixture_id || fixture_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Fixture ID is required",
        };
      }
      return repository.get_events_for_fixture(fixture_id, options);
    },

    async get_events_for_player(
      player_id: string,
      options?: { page: number; page_size: number },
    ): Promise<EntityListResult<GameEventLog>> {
      if (!player_id || player_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Player ID is required",
        };
      }
      return repository.get_events_for_player(player_id, options);
    },

    async get_scoring_events_for_live_game(
      live_game_log_id: string,
    ): Promise<EntityListResult<GameEventLog>> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Live game log ID is required",
        };
      }
      return repository.get_scoring_events_for_live_game(live_game_log_id);
    },

    async get_card_events_for_live_game(
      live_game_log_id: string,
    ): Promise<EntityListResult<GameEventLog>> {
      if (!live_game_log_id || live_game_log_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Live game log ID is required",
        };
      }
      return repository.get_card_events_for_live_game(live_game_log_id);
    },

    async void_event(
      id: string,
      reason: string,
      voided_by_user_id: string,
    ): Promise<EntityOperationResult<GameEventLog>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "GameEventLog ID is required",
        };
      }

      if (!reason || reason.trim().length === 0) {
        return {
          success: false,
          error_message: "Void reason is required",
        };
      }

      const existing_result = await repository.get_game_event_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Game event log not found",
        };
      }

      if (existing_result.data.voided) {
        return {
          success: false,
          error_message: "Event is already voided",
        };
      }

      return repository.void_event(id, reason, voided_by_user_id);
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
    ): Promise<EntityOperationResult<GameEventLog>> {
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

      return repository.create_game_event_log(input);
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
    ): Promise<EntityOperationResult<GameEventLog>> {
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

      return repository.create_game_event_log(input);
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
    ): Promise<EntityOperationResult<GameEventLog>> {
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

      return repository.create_game_event_log(input);
    },
  };
}

let singleton_use_cases: GameEventLogUseCases | null = null;

export function get_game_event_log_use_cases(): GameEventLogUseCases {
  if (!singleton_use_cases) {
    singleton_use_cases = create_game_event_log_use_cases(
      get_game_event_log_repository(),
    );
  }
  return singleton_use_cases;
}
