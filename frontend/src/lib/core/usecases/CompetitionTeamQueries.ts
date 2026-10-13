import type { CompetitionTeam } from "../entities/CompetitionTeam";
import type { CompetitionTeamRepository } from "../interfaces/ports";
import type { CompetitionTeamUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import {
  COMPETITION_TEAM_EVENT,
  COMPETITION_TEAM_LOG_SCOPE,
  COMPETITION_TEAM_MESSAGE,
} from "./CompetitionTeamConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

type CompetitionTeamQueries = Omit<
  CompetitionTeamUseCasesPort,
  "create" | "add_team_to_competition" | "update" | "delete"
>;

type MembershipKey = {
  competition_id: ScalarValueInput<CompetitionTeam["competition_id"]>;
  team_id: ScalarValueInput<CompetitionTeam["team_id"]>;
};

const log_target = create_log_target_builder(COMPETITION_TEAM_LOG_SCOPE);

function fail_missing_competition_id(): ReturnType<
  typeof fail_missing_identifier
> {
  return fail_missing_identifier(
    log_target(COMPETITION_TEAM_EVENT.COMPETITION_ID_MISSING),
    COMPETITION_TEAM_MESSAGE.COMPETITION_ID_REQUIRED,
  );
}

function fail_missing_team_id(): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier(
    log_target(COMPETITION_TEAM_EVENT.TEAM_ID_MISSING),
    COMPETITION_TEAM_MESSAGE.TEAM_ID_REQUIRED,
  );
}

function check_membership_key(key: MembershipKey): Result<MembershipKey> {
  if (is_blank_identifier(key.competition_id))
    return fail_missing_competition_id();
  if (is_blank_identifier(key.team_id)) return fail_missing_team_id();
  return create_success_result(key);
}

function create_membership_queries(
  repository: CompetitionTeamRepository,
): Pick<
  CompetitionTeamQueries,
  "remove_team_from_competition" | "is_team_in_competition"
> {
  return {
    async remove_team_from_competition(competition_id, team_id) {
      const key_result = check_membership_key({ competition_id, team_id });
      if (!key_result.success) return key_result;
      return relay_repository_result(
        repository.remove_team_from_competition(competition_id, team_id),
        log_target(COMPETITION_TEAM_EVENT.REMOVE_FAILED, key_result.data),
      );
    },
    is_team_in_competition: async (competition_id, team_id) =>
      !competition_id || !team_id
        ? fail_missing_identifier(
            log_target(COMPETITION_TEAM_EVENT.MEMBERSHIP_IDS_MISSING),
            COMPETITION_TEAM_MESSAGE.MEMBERSHIP_IDS_REQUIRED,
          )
        : repository.find_team_in_competition(competition_id, team_id),
  };
}

export function create_competition_team_queries(
  repository: CompetitionTeamRepository,
): CompetitionTeamQueries {
  return {
    ...create_membership_queries(repository),
    list: async (filter, options) =>
      relay_repository_result(
        repository.find_all(filter ?? {}, options ?? {}),
        log_target(COMPETITION_TEAM_EVENT.LIST_FAILED),
      ),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_identifier(
            log_target(COMPETITION_TEAM_EVENT.ID_MISSING),
            COMPETITION_TEAM_MESSAGE.ID_REQUIRED,
          )
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(COMPETITION_TEAM_EVENT.LOOKUP_FAILED, {
              competition_team_id: id,
            }),
          ),
    list_teams_in_competition: async (competition_id, options) =>
      is_blank_identifier(competition_id)
        ? fail_missing_competition_id()
        : relay_repository_result(
            repository.find_by_competition(competition_id, options),
            log_target(COMPETITION_TEAM_EVENT.LIST_FAILED, { competition_id }),
          ),
    list_competitions_for_team: async (team_id, options) =>
      is_blank_identifier(team_id)
        ? fail_missing_team_id()
        : relay_repository_result(
            repository.find_by_team(team_id, options),
            log_target(COMPETITION_TEAM_EVENT.LIST_FAILED, { team_id }),
          ),
  };
}
