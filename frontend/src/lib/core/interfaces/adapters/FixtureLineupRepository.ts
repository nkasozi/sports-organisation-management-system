import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../../entities/FixtureLineup";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../../entities/BaseEntity";

export interface FixtureLineupFilter {
  fixture_id?: string;
  team_id?: string;
  status?: "draft" | "submitted" | "locked";
  submitted_by?: string;
}

export interface FixtureLineupRepository {
  create_fixture_lineup(
    input: CreateFixtureLineupInput,
  ): Promise<EntityOperationResult<FixtureLineup>>;

  get_fixture_lineup_by_id(
    id: string,
  ): Promise<EntityOperationResult<FixtureLineup>>;

  update_fixture_lineup(
    id: string,
    input: UpdateFixtureLineupInput,
  ): Promise<EntityOperationResult<FixtureLineup>>;

  delete_fixture_lineup(id: string): Promise<EntityOperationResult<boolean>>;

  find_by_filter(
    filter?: FixtureLineupFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>>;

  get_lineups_for_fixture(
    fixture_id: string,
  ): Promise<EntityListResult<FixtureLineup>>;

  get_lineup_for_team_in_fixture(
    fixture_id: string,
    team_id: string,
  ): Promise<EntityOperationResult<FixtureLineup>>;

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
