import { get_fixture_lineup_use_cases } from "$lib/infrastructure/registry/useCaseFactories";

import type { FixtureLineup } from "../../core/entities/FixtureLineup";
import type { AsyncResult } from "../../core/types/Result";

const use_cases = get_fixture_lineup_use_cases();

export async function get_fixture_lineup_by_id(
  id: string,
): AsyncResult<FixtureLineup> {
  return use_cases.get_by_id(id);
}

export async function submit_lineup(id: string): AsyncResult<FixtureLineup> {
  return use_cases.submit_lineup(id);
}

async function lock_lineup(id: string): AsyncResult<FixtureLineup> {
  return use_cases.lock_lineup(id);
}
