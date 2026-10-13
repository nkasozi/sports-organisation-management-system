import type { CreateFixtureInput, Fixture } from "../entities/Fixture";
import { validate_fixture_input } from "../entities/Fixture";
import type {
  FixtureRepository,
  FixtureUseCasesPort,
  TeamRepository,
} from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import {
  create_log_target_builder,
  fail_validation,
  relay_repository_result,
} from "./FailureRelay";
import { create_fixture_game_events } from "./FixtureGameEventsUseCases";
import { generate_fixtures } from "./FixtureGenerationUseCase";
import { create_fixture_queries } from "./FixtureQueries";
import {
  create_fixture_enricher,
  type FixtureEnricher,
} from "./FixtureTeamNames";
import { FIXTURE_EVENT, FIXTURE_LOG_SCOPE } from "./FixtureUseCaseConstants";

export type FixtureUseCases = FixtureUseCasesPort;

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

async function create_fixture(
  repository: FixtureRepository,
  input: CreateFixtureInput,
): AsyncResult<Fixture> {
  const validation_errors = validate_fixture_input(input);
  if (validation_errors.length > 0)
    return fail_validation(
      log_target(FIXTURE_EVENT.VALIDATION_FAILED),
      validation_errors.join(", "),
    );
  return relay_repository_result(
    repository.create(input),
    log_target(FIXTURE_EVENT.CREATE_FAILED, {
      competition_id: input.competition_id,
    }),
  );
}

function create_enriched_list(
  repository: FixtureRepository,
  enrich: FixtureEnricher,
): FixtureUseCases["list"] {
  return async (filter, options) => {
    const result = await relay_repository_result(
      repository.find_all(filter ?? {}, options ?? {}),
      log_target(FIXTURE_EVENT.LIST_FAILED),
    );
    if (!result.success) return result;
    const items = await enrich(result.data.items);
    return create_success_result({ ...result.data, items });
  };
}

export function create_fixture_use_cases(
  repository: FixtureRepository,
  team_repository?: TeamRepository,
): FixtureUseCases {
  return {
    ...create_fixture_queries(repository),
    list: create_enriched_list(
      repository,
      create_fixture_enricher(team_repository),
    ),
    create: (input) => create_fixture(repository, input),
    generate_fixtures: (config) => generate_fixtures(repository, config),
    ...create_fixture_game_events(repository),
  };
}
