import {
  create_game_event,
  type Fixture,
  type GamePeriod,
  get_period_display_name,
  type QuickEventButton,
} from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import { get_next_period } from "$lib/presentation/logic/gameManageState";

interface RecordGameManageEventCommand {
  fixture_id: string;
  selected_event_type: QuickEventButton;
  event_minute: number;
  selected_team_side: "home" | "away";
  event_player_name: string;
  event_description: string;
}

export interface EndGamePeriodResult {
  fixture: Fixture;
  completed_period_label: string;
}

export async function start_game_session(
  fixture_id: string,
  fixture_use_cases: Pick<FixtureUseCasesPort, "start_fixture">,
): Promise<Result<Fixture>> {
  return fixture_use_cases.start_fixture(fixture_id);
}

export async function end_game_session(
  fixture_id: string,
  fixture_use_cases: Pick<FixtureUseCasesPort, "end_fixture">,
): Promise<Result<Fixture>> {
  return fixture_use_cases.end_fixture(fixture_id);
}

export async function record_game_manage_event(
  command: RecordGameManageEventCommand,
  fixture_use_cases: Pick<FixtureUseCasesPort, "record_game_event">,
): Promise<Result<Fixture>> {
  return fixture_use_cases.record_game_event(
    command.fixture_id,
    create_game_event(
      command.selected_event_type.id,
      command.event_minute,
      command.selected_team_side,
      command.event_player_name,
      command.event_description || command.selected_event_type.label,
    ),
  );
}

export async function change_game_period(
  fixture: Fixture,
  new_period: GamePeriod,
  minute: number,
  fixture_use_cases: Pick<
    FixtureUseCasesPort,
    "record_game_event" | "update_period"
  >,
): Promise<Result<Fixture>> {
  const period_event_result = await fixture_use_cases.record_game_event(
    fixture.id,
    create_game_event(
      "period_start",
      minute,
      "match",
      "",
      `${get_period_display_name(new_period)} started`,
    ),
  );

  if (!period_event_result.success) {
    return create_failure_result(period_event_result.error);
  }

  return fixture_use_cases.update_period(fixture.id, new_period, minute);
}

export async function end_game_period(
  fixture: Fixture,
  minute: number,
  fixture_use_cases: Pick<
    FixtureUseCasesPort,
    "record_game_event" | "update_period"
  >,
): Promise<Result<EndGamePeriodResult>> {
  const completed_period_label = get_period_display_name(
    fixture.current_period,
  );
  const period_event_result = await fixture_use_cases.record_game_event(
    fixture.id,
    create_game_event(
      "period_end",
      minute,
      "match",
      "",
      `${completed_period_label} ended`,
    ),
  );

  if (!period_event_result.success) {
    return create_failure_result(period_event_result.error);
  }

  const update_result = await fixture_use_cases.update_period(
    fixture.id,
    get_next_period(fixture.current_period),
    minute,
  );

  if (!update_result.success) {
    return create_failure_result(update_result.error);
  }

  return create_success_result({
    fixture: update_result.data,
    completed_period_label,
  });
}
