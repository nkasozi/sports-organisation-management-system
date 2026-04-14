import type {
  CreateFixtureInput,
  Fixture,
  FixtureStatus,
  UpdateFixtureInput,
} from "../../../../entities/Fixture";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface FixtureFilter {
  organization_id?: ScalarValueInput<Fixture["organization_id"]>;
  competition_id?: ScalarValueInput<Fixture["competition_id"]>;
  home_team_id?: ScalarValueInput<Fixture["home_team_id"]>;
  away_team_id?: ScalarValueInput<Fixture["away_team_id"]>;
  team_id?: ScalarValueInput<Fixture["home_team_id"]>;
  round_number?: number;
  match_day?: number;
  status?: FixtureStatus;
  scheduled_date_from?: ScalarValueInput<Fixture["scheduled_date"]>;
  scheduled_date_to?: ScalarValueInput<Fixture["scheduled_date"]>;
  stage_id?: ScalarValueInput<Fixture["stage_id"]>;
}

export interface FixtureRepository extends FilterableRepository<
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
  FixtureFilter
> {
  find_by_competition(
    competition_id: ScalarValueInput<Fixture["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  find_by_team(
    team_id: ScalarValueInput<Fixture["home_team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  find_by_round(
    competition_id: ScalarValueInput<Fixture["competition_id"]>,
    round_number: number,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  find_upcoming(
    competition_id?: ScalarValueInput<Fixture["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  find_by_date_range(
    start_date: ScalarValueInput<Fixture["scheduled_date"]>,
    end_date: ScalarValueInput<Fixture["scheduled_date"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  create_many(inputs: CreateFixtureInput[]): PaginatedAsyncResult<Fixture>;
}
