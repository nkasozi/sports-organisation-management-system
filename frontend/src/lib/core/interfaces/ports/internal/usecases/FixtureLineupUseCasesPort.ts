import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../../../../entities/FixtureLineup";
import type { FixtureLineupFilter } from "../../external/repositories/FixtureLineupRepository";
import type { EntityListResult } from "../../../../entities/BaseEntity";
import type { AsyncResult } from "../../../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface FixtureLineupUseCasesPort extends BaseUseCasesPort<
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
  FixtureLineupFilter
> {
  list_lineups_by_fixture(
    fixture_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>>;
  list_lineups_by_fixture_and_team(
    fixture_id: string,
    team_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>>;
  get_lineups_for_fixture(
    fixture_id: string,
  ): Promise<EntityListResult<FixtureLineup>>;
  get_lineup_for_team_in_fixture(
    fixture_id: string,
    team_id: string,
  ): AsyncResult<FixtureLineup>;
  submit_lineup(id: string): AsyncResult<FixtureLineup>;
  lock_lineup(id: string): AsyncResult<FixtureLineup>;
}
