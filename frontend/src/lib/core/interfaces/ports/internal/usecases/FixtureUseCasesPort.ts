import type {
  CreateFixtureInput,
  Fixture,
  FixtureGenerationConfig,
  GameEvent,
  GamePeriod,
  UpdateFixtureInput,
} from "../../../../entities/Fixture";
import type { FixtureClockState } from "../../../../entities/FixtureClock";
import type { FixtureClockSnapshot } from "../../../../entities/FixtureClockSnapshot";
import type { ScoreAward } from "../../../../entities/SportEventCatalogConstants";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { GameEventCorrection } from "../../../../usecases/FixtureGameEventCorrections";
import type { FixtureFilter } from "../../external/repositories/FixtureRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface FixtureUseCasesPort extends BaseUseCasesPort<
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
  FixtureFilter
> {
  list_fixtures_by_competition(
    competition_id: ScalarValueInput<Fixture["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  list_fixtures_by_team(
    team_id: ScalarValueInput<Fixture["home_team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  list_fixtures_by_round(
    competition_id: ScalarValueInput<Fixture["competition_id"]>,
    round_number: number,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  list_upcoming_fixtures(
    competition_id?: ScalarValueInput<Fixture["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture>;
  generate_fixtures(
    config: FixtureGenerationConfig,
  ): PaginatedAsyncResult<Fixture>;
  start_fixture(
    id: ScalarValueInput<Fixture["id"]>,
    first_period: GamePeriod,
  ): AsyncResult<Fixture>;
  record_game_event(
    id: ScalarValueInput<Fixture["id"]>,
    event: GameEvent,
    score_award: ScoreAward,
  ): AsyncResult<Fixture>;
  update_game_event(
    id: ScalarValueInput<Fixture["id"]>,
    event_id: string,
    correction: GameEventCorrection,
  ): AsyncResult<Fixture>;
  remove_game_event(
    id: ScalarValueInput<Fixture["id"]>,
    event_id: string,
  ): AsyncResult<Fixture>;
  update_period(
    id: ScalarValueInput<Fixture["id"]>,
    command: {
      expected_current_period: GamePeriod;
      next_period: GamePeriod;
      minute: number;
      period_sequence: GamePeriod[];
      period_event: GameEvent;
    },
  ): AsyncResult<Fixture>;
  end_fixture(id: ScalarValueInput<Fixture["id"]>): AsyncResult<Fixture>;
  save_clock_state(
    id: ScalarValueInput<Fixture["id"]>,
    clock_state: FixtureClockState,
  ): AsyncResult<Fixture>;
  save_clock_snapshot(
    id: ScalarValueInput<Fixture["id"]>,
    snapshot: FixtureClockSnapshot,
  ): AsyncResult<Fixture>;
}
