import {
  create_game_event,
  type Fixture,
  type GamePeriod,
} from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { GAME_EVENT_TYPE, TEAM_SIDE } from "./gameEventConstants";

interface EndGamePeriodResult {
  fixture: Fixture;
  completed_period_label: string;
}

type PeriodChangeUseCases = Pick<FixtureUseCasesPort, "update_period">;

const PERIOD_STARTED_SUFFIX = " started";
const PERIOD_ENDED_SUFFIX = " ended";

export async function start_game_session(
  fixture_id: string,
  fixture_use_cases: Pick<FixtureUseCasesPort, "start_fixture">,
  first_period: GamePeriod,
): Promise<Result<Fixture>> {
  return fixture_use_cases.start_fixture(fixture_id, first_period);
}

export async function end_game_session(
  fixture_id: string,
  fixture_use_cases: Pick<FixtureUseCasesPort, "end_fixture">,
): Promise<Result<Fixture>> {
  return fixture_use_cases.end_fixture(fixture_id);
}

export async function change_game_period(command: {
  fixture: Fixture;
  new_period: GamePeriod;
  new_period_label: string;
  minute: number;
  period_sequence: GamePeriod[];
  fixture_use_cases: PeriodChangeUseCases;
}): Promise<Result<Fixture>> {
  return command.fixture_use_cases.update_period(command.fixture.id, {
    expected_current_period: command.fixture.current_period,
    next_period: command.new_period,
    minute: command.minute,
    period_sequence: command.period_sequence,
    period_event: create_game_event(
      GAME_EVENT_TYPE.PERIOD_START,
      command.minute,
      TEAM_SIDE.MATCH,
      "",
      `${command.new_period_label}${PERIOD_STARTED_SUFFIX}`,
    ),
  });
}

type GamePeriodTransition = {
  next_period: GamePeriod;
  completed_period_label: string;
};

export async function end_game_period(command: {
  fixture: Fixture;
  minute: number;
  transition: GamePeriodTransition;
  period_sequence: GamePeriod[];
  fixture_use_cases: PeriodChangeUseCases;
}): Promise<Result<EndGamePeriodResult>> {
  const { fixture, minute, transition } = command;
  const update_result = await command.fixture_use_cases.update_period(
    fixture.id,
    {
      expected_current_period: fixture.current_period,
      next_period: transition.next_period,
      minute,
      period_sequence: command.period_sequence,
      period_event: create_game_event(
        GAME_EVENT_TYPE.PERIOD_END,
        minute,
        TEAM_SIDE.MATCH,
        "",
        `${transition.completed_period_label}${PERIOD_ENDED_SUFFIX}`,
      ),
    },
  );
  if (!update_result.success) return create_failure_result(update_result.error);
  return create_success_result({
    fixture: update_result.data,
    completed_period_label: transition.completed_period_label,
  });
}
