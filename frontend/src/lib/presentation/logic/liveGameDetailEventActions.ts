import {
  create_game_event,
  type GameEvent,
  type QuickEventButton,
} from "$lib/core/entities/Fixture";
import { NO_SCORE_AWARD } from "$lib/core/entities/SportEventCatalog";
import { get_fixture_use_cases } from "$lib/infrastructure/registry/useCaseFactories";

type FixtureUseCases = ReturnType<typeof get_fixture_use_cases>;

type TimedLiveGameEventCommand = {
  fixture_id: string;
  selected_event_type: QuickEventButton;
  minute: number;
  stoppage_time_minute: number;
  selected_team_side: "home" | "away";
  event_player_name: string;
  event_player_id: string;
  event_description: string;
  secondary_player_name: string;
  secondary_player_id: string;
  fixture_use_cases: FixtureUseCases;
};

type EventPlayerIdFields = Pick<GameEvent, "player_id" | "secondary_player_id">;

function build_event_player_id_fields(
  command: TimedLiveGameEventCommand,
): EventPlayerIdFields {
  return {
    ...(command.event_player_id
      ? { player_id: command.event_player_id as GameEvent["id"] }
      : {}),
    ...(command.secondary_player_id
      ? { secondary_player_id: command.secondary_player_id as GameEvent["id"] }
      : {}),
  };
}

function build_live_game_event_description(
  command: TimedLiveGameEventCommand,
): string {
  return command.secondary_player_name
    ? `${command.event_player_name} ON for ${command.secondary_player_name}`
    : command.event_description || command.selected_event_type.label;
}

export async function record_live_game_detail_timed_event(
  command: TimedLiveGameEventCommand,
): Promise<Awaited<ReturnType<FixtureUseCases["record_game_event"]>>> {
  const event = create_game_event(
    command.selected_event_type.id,
    command.minute,
    command.selected_team_side,
    command.event_player_name,
    build_live_game_event_description(command),
    command.secondary_player_name || "",
  );
  return command.fixture_use_cases.record_game_event(
    command.fixture_id,
    {
      ...event,
      ...build_event_player_id_fields(command),
      stoppage_time_minute:
        command.stoppage_time_minute as typeof event.stoppage_time_minute,
    },
    command.selected_event_type.score_award,
  );
}

export async function record_live_game_detail_event(
  fixture_id: string,
  selected_event_type: QuickEventButton,
  event_minute: number,
  selected_team_side: "home" | "away",
  event_player_name: string,
  event_description: string,
  secondary_player_name: string,
  fixture_use_cases: FixtureUseCases,
): Promise<Awaited<ReturnType<FixtureUseCases["record_game_event"]>>> {
  return record_live_game_detail_timed_event({
    fixture_id,
    selected_event_type,
    minute: event_minute,
    stoppage_time_minute: 0,
    selected_team_side,
    event_player_name,
    event_player_id: "",
    event_description,
    secondary_player_name,
    secondary_player_id: "",
    fixture_use_cases,
  });
}

export async function record_live_game_extra_time_event(
  fixture_id: string,
  elapsed_minutes: number,
  minutes_added: number,
  period_label: string,
  fixture_use_cases: FixtureUseCases,
): Promise<Awaited<ReturnType<FixtureUseCases["record_game_event"]>>> {
  return fixture_use_cases.record_game_event(
    fixture_id,
    create_game_event(
      "period_start",
      elapsed_minutes,
      "match",
      "",
      `${minutes_added} min added time - ${period_label}`,
    ),
    NO_SCORE_AWARD,
  );
}
