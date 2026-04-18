import type { Fixture, GamePeriod } from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import { create_failure_result, type Result } from "$lib/core/types/Result";
import type {
  ManagedGameFixtureState,
  ManagedGameSelectedEventTypeState,
} from "$lib/presentation/logic/managedGamePageTypes";

import {
  change_game_period,
  end_game_period,
  end_game_session,
  type EndGamePeriodResult,
  record_game_manage_event,
  start_game_session,
} from "./gameManageActions";

export async function start_managed_game(command: {
  fixture: ManagedGameFixtureState;
  fixture_use_cases: Pick<FixtureUseCasesPort, "start_fixture">;
}): Promise<Result<Fixture>> {
  if (command.fixture.status !== "present") {
    return create_failure_result("No fixture loaded");
  }

  return start_game_session(
    command.fixture.fixture.id,
    command.fixture_use_cases,
  );
}

export async function end_managed_game(command: {
  fixture: ManagedGameFixtureState;
  fixture_use_cases: Pick<FixtureUseCasesPort, "end_fixture">;
}): Promise<Result<Fixture>> {
  if (command.fixture.status !== "present") {
    return create_failure_result("No fixture loaded");
  }

  return end_game_session(
    command.fixture.fixture.id,
    command.fixture_use_cases,
  );
}

export async function record_managed_game_event(command: {
  fixture: ManagedGameFixtureState;
  selected_event_type: ManagedGameSelectedEventTypeState;
  event_minute: number;
  selected_team_side: "home" | "away";
  event_player_name: string;
  event_description: string;
  fixture_use_cases: Pick<FixtureUseCasesPort, "record_game_event">;
}): Promise<Result<Fixture>> {
  if (command.fixture.status !== "present") {
    return create_failure_result("No fixture event selected");
  }

  if (command.selected_event_type.status !== "present") {
    return create_failure_result("No fixture event selected");
  }

  return record_game_manage_event(
    {
      fixture_id: command.fixture.fixture.id,
      selected_event_type: command.selected_event_type.event_type,
      event_minute: command.event_minute,
      selected_team_side: command.selected_team_side,
      event_player_name: command.event_player_name,
      event_description: command.event_description,
    },
    command.fixture_use_cases,
  );
}

export async function change_managed_game_period(command: {
  fixture: ManagedGameFixtureState;
  new_period: GamePeriod;
  minute: number;
  fixture_use_cases: Pick<
    FixtureUseCasesPort,
    "record_game_event" | "update_period"
  >;
}): Promise<Result<Fixture>> {
  if (command.fixture.status !== "present") {
    return create_failure_result("No fixture loaded");
  }

  return change_game_period(
    command.fixture.fixture,
    command.new_period,
    command.minute,
    command.fixture_use_cases,
  );
}

export async function end_managed_game_period(command: {
  fixture: ManagedGameFixtureState;
  minute: number;
  fixture_use_cases: Pick<
    FixtureUseCasesPort,
    "record_game_event" | "update_period"
  >;
}): Promise<Result<EndGamePeriodResult>> {
  if (command.fixture.status !== "present") {
    return create_failure_result("No fixture loaded");
  }

  return end_game_period(
    command.fixture.fixture,
    command.minute,
    command.fixture_use_cases,
  );
}
