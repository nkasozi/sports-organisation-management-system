import type { Fixture, UpdateFixtureInput } from "../entities/Fixture";
import {
  type FixtureClockState,
  to_fixture_clock_fields,
} from "../entities/FixtureClock";
import {
  type FixtureClockSnapshot,
  to_fixture_clock_snapshot_fields,
} from "../entities/FixtureClockSnapshot";
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

type FixtureClockMethods = Pick<
  FixtureUseCasesPort,
  "save_clock_state" | "save_clock_snapshot"
>;

function save_clock_fields(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor,
  id: ScalarValueInput<Fixture["id"]>,
  clock_fields: UpdateFixtureInput,
): AsyncResult<Fixture> {
  if (is_blank_identifier(id))
    return Promise.resolve(fail_missing_fixture_id());
  return executor.run(String(id), () =>
    update_and_emit(repository, id, plan_from_updates(clock_fields), {
      status: PREVIOUS_FIXTURE_STATUS.UNKNOWN,
    }),
  );
}

export function create_fixture_clock_use_cases(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor = SHARED_FIXTURE_WRITE_EXECUTOR,
): FixtureClockMethods {
  return {
    save_clock_state: (id, clock_state: FixtureClockState) =>
      save_clock_fields(
        repository,
        executor,
        id,
        to_fixture_clock_fields(clock_state),
      ),
    save_clock_snapshot: (id, snapshot: FixtureClockSnapshot) =>
      save_clock_fields(
        repository,
        executor,
        id,
        to_fixture_clock_snapshot_fields(snapshot),
      ),
  };
}
