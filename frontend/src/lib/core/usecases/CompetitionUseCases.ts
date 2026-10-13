import type { Competition } from "../entities/Competition";
import type { CompetitionRepository } from "../interfaces/ports";
import type { CompetitionUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { delete_competitions } from "./CompetitionBulkDelete";
import {
  COMPETITION_EVENT,
  COMPETITION_LOG_SCOPE,
  COMPETITION_MESSAGE,
  COMPETITION_OPERATION,
} from "./CompetitionConstants";
import { create_competition, update_competition } from "./CompetitionMutations";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

export type CompetitionUseCases = CompetitionUseCasesPort;

export interface CompetitionStageLifecyclePort {
  ensure_stages_for_competition(
    competition_id: ScalarValueInput<Competition["id"]>,
    competition_format_id: ScalarValueInput<
      Competition["competition_format_id"]
    >,
  ): AsyncResult<boolean>;
  can_replace_stages_for_competition(
    competition_id: ScalarValueInput<Competition["id"]>,
  ): AsyncResult<boolean>;
  replace_stages_for_competition(
    competition_id: ScalarValueInput<Competition["id"]>,
    competition_format_id: ScalarValueInput<
      Competition["competition_format_id"]
    >,
  ): AsyncResult<boolean>;
}

type CompetitionOperation =
  (typeof COMPETITION_OPERATION)[keyof typeof COMPETITION_OPERATION];

const log_target = create_log_target_builder(COMPETITION_LOG_SCOPE);

function fail_missing_competition_id(
  operation: CompetitionOperation,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier(
    log_target(COMPETITION_EVENT.ID_MISSING, { operation }),
    COMPETITION_MESSAGE.ID_REQUIRED,
  );
}

function create_competition_queries(
  repository: CompetitionRepository,
): Pick<
  CompetitionUseCases,
  "list" | "get_by_id" | "delete" | "list_competitions_by_organization"
> {
  return {
    list: async (filter, options) =>
      relay_repository_result(
        repository.find_all(filter ?? {}, options ?? {}),
        log_target(COMPETITION_EVENT.LIST_FAILED),
      ),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_competition_id(COMPETITION_OPERATION.GET)
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(COMPETITION_EVENT.LOOKUP_FAILED, { competition_id: id }),
          ),
    delete: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_competition_id(COMPETITION_OPERATION.DELETE)
        : relay_repository_result(
            repository.delete_by_id(id),
            log_target(COMPETITION_EVENT.DELETE_FAILED, { competition_id: id }),
          ),
    list_competitions_by_organization: async (organization_id, options) =>
      is_blank_identifier(organization_id)
        ? fail_missing_identifier(
            log_target(COMPETITION_EVENT.ORGANIZATION_ID_MISSING),
            COMPETITION_MESSAGE.ORGANIZATION_ID_REQUIRED,
          )
        : relay_repository_result(
            repository.find_by_organization(organization_id, options ?? {}),
            log_target(COMPETITION_EVENT.LIST_FAILED, { organization_id }),
          ),
  };
}

export function create_competition_use_cases_with_stage_lifecycle(
  repository: CompetitionRepository,
  stage_lifecycle: CompetitionStageLifecyclePort,
): CompetitionUseCases {
  const dependencies = { repository, stage_lifecycle };
  return {
    ...create_competition_queries(repository),
    create: (input) => create_competition(dependencies, input),
    update: (id, input) => update_competition(dependencies, id, input),
    delete_competitions: (ids) => delete_competitions(repository, ids),
  };
}
