import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../../core/entities/FixtureLineup";
import type { FixtureLineupFilter } from "../../core/interfaces/adapters/FixtureLineupRepository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../../core/entities/BaseEntity";
import { get_fixture_lineup_use_cases } from "../../core/usecases/FixtureLineupUseCases";

const use_cases = get_fixture_lineup_use_cases();

export async function create_fixture_lineup(
  input: CreateFixtureLineupInput,
): Promise<EntityOperationResult<FixtureLineup>> {
  return use_cases.create(input);
}

export async function get_fixture_lineup_by_id(
  id: string,
): Promise<EntityOperationResult<FixtureLineup>> {
  return use_cases.get_by_id(id);
}

export async function update_fixture_lineup(
  id: string,
  input: UpdateFixtureLineupInput,
): Promise<EntityOperationResult<FixtureLineup>> {
  return use_cases.update(id, input);
}

export async function delete_fixture_lineup(
  id: string,
): Promise<EntityOperationResult<boolean>> {
  return use_cases.delete(id);
}

export async function list_fixture_lineups(
  filter?: FixtureLineupFilter,
  pagination?: { page: number; page_size: number },
): Promise<EntityListResult<FixtureLineup>> {
  return use_cases.list(filter, pagination);
}

export async function get_lineups_for_fixture(
  fixture_id: string,
): Promise<EntityListResult<FixtureLineup>> {
  return use_cases.get_lineups_for_fixture(fixture_id);
}

export async function get_lineup_for_team_in_fixture(
  fixture_id: string,
  team_id: string,
): Promise<EntityOperationResult<FixtureLineup>> {
  return use_cases.get_lineup_for_team_in_fixture(fixture_id, team_id);
}

export async function submit_lineup(
  id: string,
): Promise<EntityOperationResult<FixtureLineup>> {
  return use_cases.submit_lineup(id);
}

export async function lock_lineup(
  id: string,
): Promise<EntityOperationResult<FixtureLineup>> {
  return use_cases.lock_lineup(id);
}
