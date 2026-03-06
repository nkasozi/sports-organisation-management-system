import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../../../../entities/FixtureLineup";
import type { EntityListResult } from "../../../../entities/BaseEntity";
import type { AsyncResult } from "../../../../types/Result";
import type { Repository } from "./Repository";

export interface FixtureLineupFilter {
  organization_id?: string;
  fixture_id?: string;
  team_id?: string;
  status?: "draft" | "submitted" | "locked";
  submitted_by?: string;
}

export interface FixtureLineupRepository extends Repository<
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
  FixtureLineupFilter
> {
  get_lineups_for_fixture(
    fixture_id: string,
  ): Promise<EntityListResult<FixtureLineup>>;

  get_lineup_for_team_in_fixture(
    fixture_id: string,
    team_id: string,
  ): AsyncResult<FixtureLineup>;

  find_by_fixture(
    fixture_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>>;

  find_by_fixture_and_team(
    fixture_id: string,
    team_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>>;
}
