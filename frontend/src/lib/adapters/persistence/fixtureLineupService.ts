import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../../core/entities/FixtureLineup";
import type { FixtureLineupFilter } from "../../core/interfaces/ports";
import type { AsyncResult } from "../../core/types/Result";
import { get_fixture_lineup_use_cases } from "../../core/usecases/FixtureLineupUseCases";

const use_cases = get_fixture_lineup_use_cases();

export async function get_fixture_lineup_by_id(
  id: string,
): AsyncResult<FixtureLineup> {
  return use_cases.get_by_id(id);
}

export async function submit_lineup(id: string): AsyncResult<FixtureLineup> {
  return use_cases.submit_lineup(id);
}

export async function lock_lineup(id: string): AsyncResult<FixtureLineup> {
  return use_cases.lock_lineup(id);
}
