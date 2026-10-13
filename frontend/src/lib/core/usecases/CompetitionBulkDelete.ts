import { EventBus } from "$lib/infrastructure/events/EventBus";

import type { Competition } from "../entities/Competition";
import type { CompetitionRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import {
  COMPETITION_ENTITY_TYPE,
  COMPETITION_EVENT,
  COMPETITION_LOG_SCOPE,
  COMPETITION_MESSAGE,
} from "./CompetitionConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  relay_repository_failure,
} from "./FailureRelay";

const log_target = create_log_target_builder(COMPETITION_LOG_SCOPE);

function emit_deleted_competitions(
  lookup_results: Array<Result<Competition>>,
): void {
  const found_competitions = lookup_results.flatMap((lookup_result) =>
    lookup_result.success ? [lookup_result.data] : [],
  );
  lookup_results
    .flatMap((lookup_result) =>
      lookup_result.success ? [] : [lookup_result.error],
    )
    .forEach((lookup_error) =>
      console.warn(COMPETITION_LOG_SCOPE, {
        event: COMPETITION_EVENT.BULK_DELETE_LOOKUP_FAILED,
        technical_detail: lookup_error,
      }),
    );
  found_competitions.forEach((competition) =>
    EventBus.emit_entity_deleted(
      COMPETITION_ENTITY_TYPE,
      competition.id,
      competition.name || competition.id,
      competition as unknown as Record<string, unknown>,
    ),
  );
}

export async function delete_competitions(
  repository: CompetitionRepository,
  ids: Array<ScalarValueInput<Competition["id"]>>,
): AsyncResult<number> {
  if (!ids || ids.length === 0)
    return fail_missing_identifier(
      log_target(COMPETITION_EVENT.IDS_MISSING, {}),
      COMPETITION_MESSAGE.IDS_REQUIRED,
    );
  const lookup_results = await Promise.all(
    ids.map((competition_id) => repository.find_by_id(competition_id)),
  );
  const delete_result = await repository.delete_by_ids(ids);
  if (!delete_result.success)
    return relay_repository_failure(
      log_target(COMPETITION_EVENT.BULK_DELETE_FAILED, {
        competition_count: ids.length,
      }),
      delete_result.error,
    );
  emit_deleted_competitions(lookup_results);
  return delete_result;
}
