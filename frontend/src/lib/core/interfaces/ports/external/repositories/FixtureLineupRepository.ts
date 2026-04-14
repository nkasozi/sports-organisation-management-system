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
import type { Repository } from "./Repository";

export interface FixtureLineupFilter {
  organization_id?: ScalarValueInput<FixtureLineup["organization_id"]>;
  fixture_id?: ScalarValueInput<FixtureLineup["fixture_id"]>;
  team_id?: ScalarValueInput<FixtureLineup["team_id"]>;
  status?: "draft" | "submitted" | "locked";
  submitted_by?: FixtureLineup["submitted_by"];
}

export interface FixtureLineupRepository extends Repository<
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
  FixtureLineupFilter
> {
  get_lineups_for_fixture(
    fixture_id: ScalarValueInput<FixtureLineup["fixture_id"]>,
  ): AsyncResult<FixtureLineup[]>;

  get_lineup_for_team_in_fixture(
    fixture_id: ScalarValueInput<FixtureLineup["fixture_id"]>,
    team_id: ScalarValueInput<FixtureLineup["team_id"]>,
  ): AsyncResult<FixtureLineup>;

  find_by_fixture(
    fixture_id: ScalarValueInput<FixtureLineup["fixture_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<FixtureLineup>;

  find_by_fixture_and_team(
    fixture_id: ScalarValueInput<FixtureLineup["fixture_id"]>,
    team_id: ScalarValueInput<FixtureLineup["team_id"]>,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<FixtureLineup>;
}
