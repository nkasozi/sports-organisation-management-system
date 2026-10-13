import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
} from "../entities/CompetitionTeam";
import { validate_competition_team_input } from "../entities/CompetitionTeam";
import type { CompetitionTeamRepository } from "../interfaces/ports";
import type { CompetitionTeamUseCasesPort } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  COMPETITION_TEAM_EVENT,
  COMPETITION_TEAM_LOG_SCOPE,
  COMPETITION_TEAM_MESSAGE,
} from "./CompetitionTeamConstants";
import { create_competition_team_queries } from "./CompetitionTeamQueries";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

export type CompetitionTeamUseCases = CompetitionTeamUseCasesPort;

const log_target = create_log_target_builder(COMPETITION_TEAM_LOG_SCOPE);

function fail_missing_membership_id(): ReturnType<
  typeof fail_missing_identifier
> {
  return fail_missing_identifier(
    log_target(COMPETITION_TEAM_EVENT.ID_MISSING),
    COMPETITION_TEAM_MESSAGE.ID_REQUIRED,
  );
}

async function register_team_in_competition(
  repository: CompetitionTeamRepository,
  input: CreateCompetitionTeamInput,
): AsyncResult<CompetitionTeam> {
  const validation_errors = validate_competition_team_input(input);
  if (validation_errors.length > 0)
    return fail_validation(
      log_target(COMPETITION_TEAM_EVENT.VALIDATION_FAILED),
      validation_errors.join(", "),
    );
  const ids = { competition_id: input.competition_id, team_id: input.team_id };
  const existing_result = await repository.find_team_in_competition(
    input.competition_id,
    input.team_id,
  );
  if (existing_result.success)
    return fail_use_case({
      code: UseCaseErrorCode.CONFLICT,
      ...log_target(COMPETITION_TEAM_EVENT.ALREADY_REGISTERED, ids),
      user_message: COMPETITION_TEAM_MESSAGE.ALREADY_REGISTERED,
    });
  return relay_repository_result(
    repository.create(input),
    log_target(COMPETITION_TEAM_EVENT.CREATE_FAILED, ids),
  );
}

export function create_competition_team_use_cases(
  repository: CompetitionTeamRepository,
): CompetitionTeamUseCases {
  return {
    ...create_competition_team_queries(repository),
    create: (input) => register_team_in_competition(repository, input),
    add_team_to_competition: (input) =>
      register_team_in_competition(repository, input),
    update: async (id, input) =>
      is_blank_identifier(id)
        ? fail_missing_membership_id()
        : relay_repository_result(
            repository.update(id, input),
            log_target(COMPETITION_TEAM_EVENT.UPDATE_FAILED, {
              competition_team_id: id,
            }),
          ),
    delete: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_membership_id()
        : relay_repository_result(
            repository.delete_by_id(id),
            log_target(COMPETITION_TEAM_EVENT.DELETE_FAILED, {
              competition_team_id: id,
            }),
          ),
  };
}
