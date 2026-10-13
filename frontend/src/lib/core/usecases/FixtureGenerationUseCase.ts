import { EventBus } from "$lib/infrastructure/events/EventBus";

import type { Fixture, FixtureGenerationConfig } from "../entities/Fixture";
import { generate_round_robin_fixtures } from "../entities/Fixture";
import { count_generated_rounds } from "../entities/FixtureGeneration";
import type { FixtureRepository } from "../interfaces/ports";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import type { PaginatedAsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  relay_repository_result,
} from "./FailureRelay";
import { build_fixture_display_name } from "./FixtureDisplay";
import {
  build_unmapped_rounds_message,
  FIXTURE_ENTITY_TYPE,
  FIXTURE_EVENT,
  FIXTURE_LOG_SCOPE,
  FIXTURE_MESSAGE,
  MINIMUM_GENERATION_TEAMS,
} from "./FixtureUseCaseConstants";

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

function find_unmapped_rounds(config: FixtureGenerationConfig): number[] {
  return Array.from(
    { length: count_generated_rounds(config) },
    (_, index) => index + 1,
  ).filter((round) => !config.stage_id_per_round[round]?.trim());
}

function find_generation_problem(
  config: FixtureGenerationConfig,
): Option<string> {
  if (!config.team_ids || config.team_ids.length < MINIMUM_GENERATION_TEAMS)
    return create_some_option(FIXTURE_MESSAGE.TEAMS_TOO_FEW);
  if (!config.start_date)
    return create_some_option(FIXTURE_MESSAGE.START_DATE_REQUIRED);
  const unmapped_rounds = find_unmapped_rounds(config);
  return unmapped_rounds.length > 0
    ? create_some_option(build_unmapped_rounds_message(unmapped_rounds))
    : create_none_option();
}

function check_generation_config(
  config: FixtureGenerationConfig,
): Result<FixtureGenerationConfig> {
  if (!config.competition_id)
    return fail_missing_identifier(
      log_target(FIXTURE_EVENT.COMPETITION_ID_MISSING),
      FIXTURE_MESSAGE.COMPETITION_ID_REQUIRED,
    );
  const problem = find_generation_problem(config);
  switch (problem.status) {
    case OptionStatus.NONE:
      return create_success_result(config);
    case OptionStatus.SOME:
      return fail_validation(
        log_target(FIXTURE_EVENT.GENERATION_INVALID, {
          competition_id: config.competition_id,
        }),
        problem.value,
      );
  }
}

function emit_fixtures_created(fixtures: Fixture[]): void {
  fixtures.forEach((created) =>
    EventBus.emit_entity_created(
      FIXTURE_ENTITY_TYPE,
      created.id,
      build_fixture_display_name(created),
      created as unknown as Record<string, unknown>,
    ),
  );
}

export async function generate_fixtures(
  repository: FixtureRepository,
  config: FixtureGenerationConfig,
): PaginatedAsyncResult<Fixture> {
  const config_result = check_generation_config(config);
  if (!config_result.success) return config_result;
  const result = await relay_repository_result(
    repository.create_many(generate_round_robin_fixtures(config)),
    log_target(FIXTURE_EVENT.GENERATE_FAILED, {
      competition_id: config.competition_id,
    }),
  );
  if (result.success) emit_fixtures_created(result.data.items);
  return result;
}
