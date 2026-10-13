import type {
  PlayerTeamMembershipRepository,
  PlayerTeamTransferHistoryRepository,
  PlayerTeamTransferHistoryUseCasesPort,
} from "../interfaces/ports";
import {
  create_transfer,
  delete_transfer,
  delete_transfers,
  update_transfer,
} from "./PlayerTeamTransferHistoryMutations";
import {
  forward_transfer_dependency,
  get_transfer_by_id,
  list_transfers_by_player,
  list_transfers_by_team,
} from "./PlayerTeamTransferHistoryQueries";
import { PlayerTeamTransferEvent } from "./PlayerTeamTransferUseCasesConstants";
import { create_transfer_confirmation } from "./TransferConfirmationUseCases";

export type PlayerTeamTransferHistoryUseCases =
  PlayerTeamTransferHistoryUseCasesPort;

export function create_player_team_transfer_history_use_cases(
  repository: PlayerTeamTransferHistoryRepository,
  membership_repository: PlayerTeamMembershipRepository,
): PlayerTeamTransferHistoryUseCases {
  return {
    list: async (filter, options) =>
      forward_transfer_dependency(
        await repository.find_all(filter ?? {}, options ?? {}),
        PlayerTeamTransferEvent.LIST_FAILED,
        {},
      ),
    get_by_id: (id) => get_transfer_by_id(repository, id),
    create: (input) => create_transfer(repository, input),
    update: (id, input) => update_transfer(repository, id, input),
    delete: (id) => delete_transfer(repository, id),
    list_transfers_by_player: (player_id, options) =>
      list_transfers_by_player(repository, player_id, options),
    list_transfers_by_team: (team_id, options) =>
      list_transfers_by_team(repository, team_id, options),
    list_pending_transfers: async (options) =>
      forward_transfer_dependency(
        await repository.find_pending_transfers(options),
        PlayerTeamTransferEvent.LIST_FAILED,
        {},
      ),
    ...create_transfer_confirmation(repository, membership_repository),
    delete_transfers: (ids) => delete_transfers(repository, ids),
  };
}
