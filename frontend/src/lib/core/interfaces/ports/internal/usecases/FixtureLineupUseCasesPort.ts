import type {
  CreateFixtureLineupInput,
  FixtureLineup,
  UpdateFixtureLineupInput,
} from "../../../../entities/FixtureLineup";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { FixtureLineupFilter } from "../../external/repositories/FixtureLineupRepository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface FixtureLineupUseCasesPort extends BaseUseCasesPort<
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
  FixtureLineupFilter
> {
  list_lineups_by_fixture(
    fixture_id: ScalarValueInput<FixtureLineup["fixture_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<FixtureLineup>;
  list_lineups_by_fixture_and_team(
    fixture_id: ScalarValueInput<FixtureLineup["fixture_id"]>,
    team_id: ScalarValueInput<FixtureLineup["team_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<FixtureLineup>;
  get_lineups_for_fixture(
    fixture_id: ScalarValueInput<FixtureLineup["fixture_id"]>,
  ): AsyncResult<FixtureLineup[]>;
  get_lineup_for_team_in_fixture(
    fixture_id: ScalarValueInput<FixtureLineup["fixture_id"]>,
    team_id: ScalarValueInput<FixtureLineup["team_id"]>,
  ): AsyncResult<FixtureLineup>;
  submit_lineup(
    id: ScalarValueInput<FixtureLineup["id"]>,
  ): AsyncResult<FixtureLineup>;
  lock_lineup(
    id: ScalarValueInput<FixtureLineup["id"]>,
  ): AsyncResult<FixtureLineup>;
}
