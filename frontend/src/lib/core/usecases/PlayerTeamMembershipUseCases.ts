import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import type { PlayerTeamMembershipUseCasesPort } from "../interfaces/ports";
import {
  create_membership,
  delete_membership,
  delete_memberships,
  update_membership,
} from "./PlayerTeamMembershipUseCasesMutations";
import {
  get_membership_by_id,
  list_memberships,
  list_memberships_by_player,
  list_memberships_by_team,
} from "./PlayerTeamMembershipUseCasesQueries";

export type PlayerTeamMembershipUseCases = PlayerTeamMembershipUseCasesPort;

export function create_player_team_membership_use_cases(
  repository: PlayerTeamMembershipRepository,
): PlayerTeamMembershipUseCases {
  return {
    list: (filter, options) =>
      list_memberships(repository, filter ?? {}, options ?? {}),
    get_by_id: (id) => get_membership_by_id(repository, id),
    create: (input) => create_membership(repository, input),
    update: (id, input) => update_membership(repository, id, input),
    delete: (id) => delete_membership(repository, id),
    list_memberships_by_team: (team_id, options) =>
      list_memberships_by_team(repository, team_id, options),
    list_memberships_by_player: (player_id, options) =>
      list_memberships_by_player(repository, player_id, options),
    delete_memberships: (ids) => delete_memberships(repository, ids),
  };
}
