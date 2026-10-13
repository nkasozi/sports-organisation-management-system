import type { Fixture } from "../entities/Fixture";
import {
  type FixtureClockState,
  to_fixture_clock_fields,
} from "../entities/FixtureClock";
import type {
  FixtureRepository,
  FixtureUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { is_blank_identifier } from "./FailureRelay";
import { fail_missing_fixture_id } from "./FixtureGameEventLookups";
import {
  plan_from_updates,
  PREVIOUS_FIXTURE_STATUS,
  update_and_emit,
} from "./FixtureGameEventUpdates";
import { SHARED_FIXTURE_WRITE_EXECUTOR } from "./FixtureWriteExecutor";
import type { KeyedSerialExecutor } from "./KeyedSerialExecutor";

type FixtureClockMethods = Pick<FixtureUseCasesPort, "save_clock_state">;

function save_clock_state(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor,
  id: ScalarValueInput<Fixture["id"]>,
  clock_state: FixtureClockState,
): AsyncResult<Fixture> {
  if (is_blank_identifier(id))
    return Promise.resolve(fail_missing_fixture_id());
  return executor.run(String(id), () =>
    update_and_emit(
      repository,
      id,
      plan_from_updates(to_fixture_clock_fields(clock_state)),
      { status: PREVIOUS_FIXTURE_STATUS.UNKNOWN },
    ),
  );
}

export function create_fixture_clock_use_cases(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor = SHARED_FIXTURE_WRITE_EXECUTOR,
): FixtureClockMethods {
  return {
    save_clock_state: (id, clock_state) =>
      save_clock_state(repository, executor, id, clock_state),
  };
}
