import type {
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
  FixtureGenerationConfig,
  GameEvent,
  GamePeriod,
} from "../../entities/Fixture";
import type { FixtureFilter } from "../adapters/FixtureRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface FixtureUseCasesPort extends BaseUseCasesPort<
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
  FixtureFilter
> {
  list_fixtures_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  list_fixtures_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  list_fixtures_by_round(
    competition_id: string,
    round_number: number,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  list_upcoming_fixtures(
    competition_id?: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  generate_fixtures(
    config: FixtureGenerationConfig,
  ): PaginatedAsyncResult<Fixture>;
  update_fixture_score(
    id: string,
    home_score: number,
    away_score: number,
  ): AsyncResult<Fixture>;
  start_fixture(id: string): AsyncResult<Fixture>;
  record_game_event(id: string, event: GameEvent): AsyncResult<Fixture>;
  update_period(
    id: string,
    period: GamePeriod,
    minute: number,
  ): AsyncResult<Fixture>;
  end_fixture(id: string): AsyncResult<Fixture>;
}
