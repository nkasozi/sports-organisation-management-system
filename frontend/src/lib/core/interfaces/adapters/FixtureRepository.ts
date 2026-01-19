import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";
import type {
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
  FixtureStatus,
} from "../../entities/Fixture";

export interface FixtureFilter {
  competition_id?: string;
  home_team_id?: string;
  away_team_id?: string;
  team_id?: string;
  round_number?: number;
  match_day?: number;
  status?: FixtureStatus;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
}

export interface FixtureRepository extends FilterableRepository<
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
  FixtureFilter
> {
  find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  find_by_round(
    competition_id: string,
    round_number: number,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  find_upcoming(
    competition_id?: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  find_by_date_range(
    start_date: string,
    end_date: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  create_many(inputs: CreateFixtureInput[]): PaginatedAsyncResult<Fixture>;
}
