import type { Player } from "../../core/entities/Player";
import type { PlayerTeamMembership } from "../../core/entities/PlayerTeamMembership";
import type {
  PlayerTeamMembershipRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { AsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import {
  type PlayerIdSelection,
  select_team_members,
} from "./InBrowserPlayerRepositoryFilters";

const ALL_MEMBERSHIPS_PAGE: QueryOptions = { page_number: 1, page_size: 10000 };

export async function load_team_memberships(
  membership_repository: PlayerTeamMembershipRepository,
  team_id: ScalarValueInput<Player["id"]>,
): AsyncResult<PlayerTeamMembership[]> {
  const membership_result = await membership_repository.find_by_team(
    team_id,
    ALL_MEMBERSHIPS_PAGE,
  );
  if (!membership_result.success) return membership_result;
  return create_success_result(membership_result.data.items);
}

export async function load_team_member_selection(
  membership_repository: PlayerTeamMembershipRepository,
  team_id: ScalarValueInput<Player["id"]>,
): AsyncResult<PlayerIdSelection> {
  const memberships_result = await load_team_memberships(
    membership_repository,
    team_id,
  );
  if (!memberships_result.success) return memberships_result;
  return create_success_result(
    select_team_members(memberships_result.data.map((m) => m.player_id)),
  );
}
