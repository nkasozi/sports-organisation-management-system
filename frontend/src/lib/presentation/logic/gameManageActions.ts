import {
  create_game_event,
  type Fixture,
  type GamePeriod,
} from "$lib/core/entities/Fixture";
import { NO_SCORE_AWARD } from "$lib/core/entities/SportEventCatalog";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

interface EndGamePeriodResult {
  fixture: Fixture;
  completed_period_label: string;
}

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
  fixture_use_cases: Pick<
    FixtureUseCasesPort,
    "record_game_event" | "update_period"
  >;
}): Promise<Result<Fixture>> {
  const { fixture, new_period, minute, fixture_use_cases } = command;
  const period_event_result = await fixture_use_cases.record_game_event(
    fixture.id,
    create_game_event(
      "period_start",
      minute,
      "match",
      "",
      `${command.new_period_label} started`,
    ),
    NO_SCORE_AWARD,
  );

  if (!period_event_result.success) {
    return create_failure_result(period_event_result.error);
  }

  return fixture_use_cases.update_period(fixture.id, new_period, minute);
}

type GamePeriodTransition = {
  next_period: GamePeriod;
  completed_period_label: string;
};

export async function end_game_period(command: {
  fixture: Fixture;
  minute: number;
  transition: GamePeriodTransition;
  fixture_use_cases: Pick<
    FixtureUseCasesPort,
    "record_game_event" | "update_period"
  >;
}): Promise<Result<EndGamePeriodResult>> {
  const { fixture, minute, transition, fixture_use_cases } = command;
  const period_event_result = await fixture_use_cases.record_game_event(
    fixture.id,
    create_game_event(
      "period_end",
      minute,
      "match",
      "",
      `${transition.completed_period_label} ended`,
    ),
    NO_SCORE_AWARD,
  );
  if (!period_event_result.success) {
    return create_failure_result(period_event_result.error);
  }
  const update_result = await fixture_use_cases.update_period(
    fixture.id,
    transition.next_period,
    minute,
  );
  if (!update_result.success) {
    return create_failure_result(update_result.error);
  }
  return create_success_result({
    fixture: update_result.data,
    completed_period_label: transition.completed_period_label,
  });
}
